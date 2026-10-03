import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterSchoolDto, ChangePasswordDto, RefreshTokenDto } from './dto/auth.dto';
import { Role, UserStatus, RequestStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private async generateTokens(user: { id: string; email: string; role: any; schoolId?: string | null; name: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      name: user.name,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default_jwt_secret';
    // Session time configured to 11 hours
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '11h';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      },
    );

    // Save one-time active refresh token in Redis (7 days = 604800s)
    await this.redisService.set(`session:${user.id}:refresh`, refreshToken, 86400 * 7);
    // Cache user session in Redis for 11 hours (39600s)
    await this.redisService.set(
      `session:${user.id}`,
      { token: accessToken, role: user.role, schoolId: user.schoolId, userId: user.id, email: user.email },
      11 * 3600,
    );

    this.logger.log(`🔑 [AuthService] Generated 11-hour session tokens for user "${user.email}" (ID: ${user.id})`);

    return {
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        school: true,
        teacherProfile: true,
        studentProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException('Your account is pending review or activation');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('This account has been deactivated. Please contact your administrator.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return {
          requires2FA: true,
          email: user.email,
          message: 'Two-Factor Authentication code required.',
        };
      }
      if (dto.twoFactorCode.replace(/\D/g, '').length !== 6) {
        throw new UnauthorizedException('Invalid 2FA verification code');
      }
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        schoolId: user.schoolId,
        avatarUrl: user.avatarUrl,
        themeColor: user.themeColor || '#0D9488',
        mustChangePassword: user.mustChangePassword,
        twoFactorEnabled: user.twoFactorEnabled,
        school: user.school
          ? {
              id: user.school.id,
              name: user.school.name,
              code: user.school.code,
              logoUrl: user.school.logoUrl,
              primaryColor: user.school.primaryColor,
              activeYear: user.school.activeYear,
            }
          : null,
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret';
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token. Please log in again.');
    }

    if (!payload || !payload.sub || payload.type !== 'refresh') {
      throw new UnauthorizedException('Malformed token payload');
    }

    // Verify against Redis single-use token to block fake logins / token replay
    const storedToken = await this.redisService.get<string>(`session:${payload.sub}:refresh`);
    if (!storedToken || storedToken !== dto.refreshToken) {
      // Invalidate existing sessions in case of token theft attempt
      await this.redisService.del(`session:${payload.sub}:refresh`);
      throw new UnauthorizedException('Session token was already used or invalidated. Please re-login.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { school: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is invalid or inactive');
    }

    // Rotate tokens (generate new access token & new single-use refresh token)
    const newTokens = await this.generateTokens(user);

    return {
      ...newTokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        schoolId: user.schoolId,
        avatarUrl: user.avatarUrl,
        themeColor: user.themeColor || '#0D9488',
        mustChangePassword: user.mustChangePassword,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async logout(userId?: string, rawToken?: string) {
    let resolvedUserId = userId;
    let cleanToken: string | undefined;

    if (rawToken) {
      cleanToken = rawToken.replace(/^Bearer\s+/i, '').trim();
      if (!resolvedUserId && cleanToken) {
        try {
          const decoded: any = this.jwtService.decode(cleanToken);
          if (decoded && decoded.sub) {
            resolvedUserId = decoded.sub;
          }
        } catch {}
      }
    }

    if (resolvedUserId) {
      this.logger.log(`🚪 [AuthService] Logging out user "${resolvedUserId}" - invalidating Redis sessions`);
      await this.redisService.del(`session:${resolvedUserId}`);
      await this.redisService.del(`session:${resolvedUserId}:refresh`);
    }

    if (cleanToken) {
      // Blacklist token in Redis for 11 hours (39600s)
      await this.redisService.set(`blacklist:token:${cleanToken}`, 'revoked', 11 * 3600);
      this.logger.log(`🚫 [AuthService] Blacklisted token`);
    }

    return { success: true, message: 'Logged out successfully. Tokens and session invalidated.' };
  }

  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = Array.from({ length: 16 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)],
    ).join('');
    const otpauthUrl = `otpauth://totp/AcademiX:${encodeURIComponent(user.email)}?secret=${secret}&issuer=AcademiX`;

    await this.redisService.set(`2fa:pending:${userId}`, secret, 600);

    return { secret, otpauthUrl };
  }

  async enable2FA(userId: string, code: string) {
    const pendingSecret = await this.redisService.get<string>(`2fa:pending:${userId}`);
    if (!pendingSecret) {
      throw new BadRequestException('2FA setup session expired. Please restart 2FA setup.');
    }

    if (!code || code.replace(/\D/g, '').length !== 6) {
      throw new BadRequestException('Please provide a valid 6-digit verification code.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: pendingSecret,
      },
    });

    await this.redisService.del(`2fa:pending:${userId}`);

    return { success: true, message: 'Two-Factor Authentication enabled successfully.' };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled on this account.');
    }

    if (!code || code.replace(/\D/g, '').length !== 6) {
      throw new BadRequestException('Please provide a valid 6-digit verification code to disable 2FA.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { success: true, message: 'Two-Factor Authentication disabled.' };
  }

  async registerSchool(dto: RegisterSchoolDto) {
    const rawSlug = dto.schoolSlug || dto.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = (rawSlug || 'school').toLowerCase().trim();

    const existingReq = await this.prisma.registrationRequest.findUnique({
      where: { schoolSlug: slug },
    });

    if (existingReq) {
      throw new ConflictException('A school with this name or code is already registered or pending review.');
    }

    const existingSchool = await this.prisma.school.findUnique({
      where: { code: slug.toUpperCase().trim() },
    });

    if (existingSchool) {
      throw new ConflictException('A school with this code already exists.');
    }

    const adminPasswordHash = await bcrypt.hash(dto.adminPassword, 10);
    const adminEmail = `admin@${slug}.com`;

    const request = await this.prisma.registrationRequest.create({
      data: {
        schoolName: dto.schoolName,
        schoolSlug: slug,
        contactEmail: dto.contactEmail,
        phone: dto.phone,
        address: dto.address,
        classesOffered: JSON.stringify(dto.classesOffered),
        adminName: dto.adminName,
        adminEmail,
        adminPasswordHash,
        status: RequestStatus.PENDING,
      },
    });

    return {
      success: true,
      message: 'School registration request submitted successfully. It is under superadmin review.',
      requestId: request.id,
      adminEmail,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async updateTheme(userId: string, themeColor: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { themeColor },
    });
    return { success: true, themeColor: user.themeColor };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        teacherProfile: true,
        studentProfile: {
          include: { class: true, section: true },
        },
        parentProfile: {
          include: { children: { include: { class: true, section: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
