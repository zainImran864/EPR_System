import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterSchoolDto, ChangePasswordDto } from './dto/auth.dto';
import { Role, UserStatus, RequestStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

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

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      name: user.name,
    };

    const token = this.jwtService.sign(payload);

    // Cache user session in Redis for instant authorization
    await this.redisService.set(`session:${user.id}`, { token, role: user.role, schoolId: user.schoolId }, 86400 * 7);

    return {
      token,
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

  async registerSchool(dto: RegisterSchoolDto) {
    const existingReq = await this.prisma.registrationRequest.findUnique({
      where: { schoolSlug: dto.schoolSlug.toLowerCase().trim() },
    });

    if (existingReq) {
      throw new ConflictException('A school with this slug is already registered or requested');
    }

    const existingSchool = await this.prisma.school.findUnique({
      where: { code: dto.schoolSlug.toUpperCase().trim() },
    });

    if (existingSchool) {
      throw new ConflictException('A school with this code already exists');
    }

    const adminPasswordHash = await bcrypt.hash(dto.adminPassword, 10);

    const request = await this.prisma.registrationRequest.create({
      data: {
        schoolName: dto.schoolName,
        schoolSlug: dto.schoolSlug.toLowerCase().trim(),
        contactEmail: dto.contactEmail,
        phone: dto.phone,
        address: dto.address,
        classesOffered: JSON.stringify(dto.classesOffered),
        adminName: dto.adminName,
        adminEmail: `admin@${dto.schoolSlug.toLowerCase()}.com`,
        adminPasswordHash,
        status: RequestStatus.PENDING,
      },
    });

    return {
      success: true,
      message: 'School registration request submitted successfully. It is under superadmin review.',
      requestId: request.id,
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
