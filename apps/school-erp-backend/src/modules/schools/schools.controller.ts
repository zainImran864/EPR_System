import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { UpdateSchoolDto, UpdateSmtpDto, TestSmtpDto } from './dto/school.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('by-code/:code')
  async getSchoolByCode(@Param('code') code: string) {
    return this.schoolsService.getSchoolByCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('current')
  async getCurrentSchool(@CurrentUser() user: CurrentUserPayload) {
    if (!user.schoolId) {
      return null;
    }
    return this.schoolsService.getSchoolById(user.schoolId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('current')
  async updateCurrentSchool(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateSchoolDto,
  ) {
    return this.schoolsService.updateSchool(user.schoolId!, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Get('current/smtp')
  async getSmtpSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.schoolsService.getSmtpSettings(user.schoolId!);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('current/smtp')
  async updateSmtp(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateSmtpDto,
  ) {
    return this.schoolsService.updateSmtp(user.schoolId!, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Post('current/smtp/test')
  async testSmtp(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TestSmtpDto,
  ) {
    return this.schoolsService.testSmtpConnection(user.schoolId!, dto);
  }

  // SuperAdmin Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Get('superadmin/all')
  async listAllSchools() {
    return this.schoolsService.listAllSchools();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Get('superadmin/pending-requests')
  async listPendingRegistrations() {
    return this.schoolsService.listPendingRegistrations();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Post('superadmin/requests/:id/approve')
  async approveRegistration(@Param('id') id: string) {
    return this.schoolsService.approveRegistration(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Post('superadmin/requests/:id/reject')
  async rejectRegistration(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.schoolsService.rejectRegistration(id, reason);
  }
}
