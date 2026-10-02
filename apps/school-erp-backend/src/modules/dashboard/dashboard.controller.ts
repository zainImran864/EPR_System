import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  async getAdminStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('fresh') fresh?: string,
  ) {
    const isFresh = fresh === 'true' || fresh === '1';
    return this.dashboardService.getAdminStats(user.schoolId!, isFresh);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @Get('teacher')
  async getTeacherDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getTeacherDashboard(user.schoolId!, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @Get('student')
  async getStudentDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getStudentDashboard(user.schoolId!, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Get('superadmin')
  async getSuperAdminStats() {
    return this.dashboardService.getSuperAdminStats();
  }
}
