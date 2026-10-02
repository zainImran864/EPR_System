import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableEntryDto } from './dto/timetable.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get('my')
  async getMyTimetable(@CurrentUser() user: CurrentUserPayload) {
    return this.timetableService.getMyTimetable(user);
  }

  @Get('section/:sectionId')
  async getSectionTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sectionId') sectionId: string,
  ) {
    return this.timetableService.getSectionTimetable(user.schoolId!, sectionId);
  }

  @Get('teacher/:teacherId')
  async getTeacherTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Param('teacherId') teacherId: string,
  ) {
    return this.timetableService.getTeacherTimetable(user.schoolId!, teacherId);
  }

  @Get('student/:studentId')
  async getStudentTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.timetableService.getStudentTimetable(user.schoolId!, studentId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('entry')
  async createEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTimetableEntryDto,
  ) {
    return this.timetableService.createEntry(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('entry/:id')
  async deleteEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteEntry(user.schoolId!, id);
  }
}
