import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  MarkAttendanceDto,
  MarkTeacherAttendanceDto,
  UpdateSchoolLocationDto,
  ApplyTeacherLeaveDto,
  ReviewTeacherLeaveDto,
  CreateQrSessionDto,
  SubmitQrSessionDto,
  ApplyStudentLeaveDto,
  ReviewStudentLeaveDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  async getAttendanceByQuery(
    @CurrentUser() user: CurrentUserPayload,
    @Query('sectionId') sectionId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    if (!sectionId) return [];
    return this.attendanceService.getSectionAttendance(user.schoolId!, sectionId, targetDate);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Teacher Self-Attendance (Photo + Live GPS Geofence + 3-Day Image Retention)
  // ───────────────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('teacher/context')
  async getTeacherContext(@CurrentUser() user: CurrentUserPayload) {
    return this.attendanceService.getTeacherContext(user.schoolId!, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('teacher/check-in')
  async markTeacherSelfAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: MarkTeacherAttendanceDto,
  ) {
    return this.attendanceService.markTeacherSelfAttendance(user.schoolId!, user.userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @Get('teacher/records')
  async getAdminTeacherAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getAdminTeacherAttendance(user.schoolId!, date);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('teacher/school-location')
  async updateSchoolLocation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateSchoolLocationDto,
  ) {
    return this.attendanceService.updateSchoolLocation(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @Post('teacher/purge-old-photos')
  async purgeExpiredAttendancePhotos(@CurrentUser() user: CurrentUserPayload) {
    return this.attendanceService.purgeExpiredAttendancePhotos(user.schoolId!);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Mobile QR Code Live GPS & Photo Handshake (Teacher & Admin)
  // ───────────────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @Post('teacher/qr-session')
  async createQrSession(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateQrSessionDto,
  ) {
    return this.attendanceService.createQrSession(
      user.schoolId!,
      user.userId,
      user.role,
      dto?.mode || (user.role === Role.ADMIN ? 'ADMIN_SET_LOCATION' : 'TEACHER_CHECKIN'),
    );
  }

  @Get('teacher/qr-session/:sessionId')
  async getQrSession(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getQrSession(sessionId);
  }

  @Post('teacher/qr-session/:sessionId/submit')
  async submitQrSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitQrSessionDto,
  ) {
    return this.attendanceService.submitQrSession(sessionId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('teacher/leaves')
  async applyTeacherLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ApplyTeacherLeaveDto,
  ) {
    return this.attendanceService.applyTeacherLeave(user.schoolId!, user.userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @Get('teacher/leaves')
  async listTeacherLeaves(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
  ) {
    return this.attendanceService.listTeacherLeaves(
      user.schoolId!,
      user.userId,
      user.role,
      status,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('teacher/leaves/:id/review')
  async reviewTeacherLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ReviewTeacherLeaveDto,
  ) {
    return this.attendanceService.reviewTeacherLeave(user.schoolId!, user.userId, id, dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Student Section Attendance Endpoints
  // ───────────────────────────────────────────────────────────────────────────

  @Get('section/:sectionId')
  async getSectionAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sectionId') sectionId: string,
    @Query('date') date: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getSectionAttendance(user.schoolId!, sectionId, targetDate);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('mark')
  async markAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(user.schoolId!, user.userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('bulk')
  async bulkMarkAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(user.schoolId!, user.userId, dto);
  }

  @Get('student/:studentId')
  async getStudentAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Query('month') month?: string,
  ) {
    return this.attendanceService.getStudentAttendance(user.schoolId!, studentId, month);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Student Leave Management (Parent Application -> Teacher/Admin Review)
  // ───────────────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(Role.PARENT, Role.ADMIN)
  @Post('student/leaves')
  async applyStudentLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ApplyStudentLeaveDto,
  ) {
    return this.attendanceService.applyStudentLeave(user.schoolId!, user.userId, user.role as Role, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN)
  @Get('student/leaves')
  async listStudentLeaves(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
  ) {
    return this.attendanceService.listStudentLeaves(user.schoolId!, user.userId, user.role as Role, status);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Patch('student/leaves/:id/review')
  async reviewStudentLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ReviewStudentLeaveDto,
  ) {
    return this.attendanceService.reviewStudentLeave(user.schoolId!, user.userId, id, dto);
  }
}
