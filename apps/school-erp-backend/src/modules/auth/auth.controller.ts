import { Controller, Post, Body, Get, UseGuards, Patch, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterSchoolDto,
  ChangePasswordDto,
  UpdateThemeDto,
  RefreshTokenDto,
  TwoFactorVerifyDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.authService.logout(user.userId, authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2FA(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.generate2FASecret(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2FA(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TwoFactorVerifyDto,
  ) {
    return this.authService.enable2FA(user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disable2FA(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TwoFactorVerifyDto,
  ) {
    return this.authService.disable2FA(user.userId, dto.code);
  }

  @Post('register-school')
  async registerSchool(@Body() dto: RegisterSchoolDto) {
    return this.authService.registerSchool(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('theme')
  async updateTheme(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateThemeDto,
  ) {
    return this.authService.updateTheme(user.userId, dto.themeColor);
  }
}
