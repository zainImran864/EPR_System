import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  schoolId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_jwt_secret',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    // 1. Check if token was explicitly revoked / blacklisted on logout
    const rawHeader = req.headers?.authorization || '';
    const rawToken = rawHeader.replace(/^Bearer\s+/i, '').trim();

    if (rawToken) {
      const isBlacklisted = await this.redisService.get(`blacklist:token:${rawToken}`);
      if (isBlacklisted) {
        this.logger.warn(`🚫 [JwtStrategy] Blocked request with revoked/logged-out token for user ${payload.sub}`);
        throw new UnauthorizedException('Session has been terminated upon logout. Please log in again.');
      }
    }

    // 2. Check if active session exists in Redis
    const session = await this.redisService.get(`session:${payload.sub}`);
    if (!session) {
      this.logger.warn(`⚠️ [JwtStrategy] No active Redis session found for user ${payload.sub} (Session expired or logged out)`);
      throw new UnauthorizedException('Session expired or logged out. Please log in again.');
    }

    // 3. Verify user status in Database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { school: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      this.logger.warn(`⚠️ [JwtStrategy] Inactive or non-existent user rejected: ${payload.sub}`);
      throw new UnauthorizedException('User account is invalid or inactive');
    }

    this.logger.debug(`🛡️ [JwtStrategy] Verified user session: ${user.email} (${user.role})`);

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      name: user.name,
      school: user.school,
      themeColor: user.themeColor,
    };
  }
}
