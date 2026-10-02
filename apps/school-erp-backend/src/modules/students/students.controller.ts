import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateStudentStatusDto,
  PromoteStudentDto,
  DemoteStudentDto,
  AutoProgressionDto,
  ProgressionDecisionDto,
} from './dto/student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async listStudents(
    @CurrentUser() user: CurrentUserPayload,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studentsService.listStudents(user.schoolId!, {
      classId,
      sectionId,
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('next-admission-number')
  async getNextAdmissionNumber(@CurrentUser() user: CurrentUserPayload) {
    const admissionNumber = await this.studentsService.nextAdmissionNumber(user.schoolId!);
    return { admissionNumber };
  }

  @Get(':id')
  async getStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.studentsService.getStudentById(user.schoolId!, id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.createStudent(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.updateStudent(user.schoolId!, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentStatusDto,
  ) {
    return this.studentsService.updateStatus(user.schoolId!, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/promote')
  async promoteStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: PromoteStudentDto,
  ) {
    return this.studentsService.promoteStudent(user.schoolId!, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/demote')
  async demoteStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: DemoteStudentDto,
  ) {
    return this.studentsService.demoteStudent(user.schoolId!, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('auto-progression')
  async autoProgressAcademicYear(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AutoProgressionDto,
  ) {
    return this.studentsService.autoProgressAcademicYear(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('apply-decisions')
  async applyProgressionDecisions(
    @CurrentUser() user: CurrentUserPayload,
    @Body('decisions') decisions: ProgressionDecisionDto[],
  ) {
    return this.studentsService.applyProgressionDecisions(user.schoolId!, decisions);
  }
}
