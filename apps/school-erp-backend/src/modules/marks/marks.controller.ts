import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MarksService } from './marks.service';
import {
  CreateExamTermDto,
  SaveMarksDto,
  SavePaperSchedulesDto,
  CreateQuestionPaperDto,
} from './dto/marks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('marks')
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

  @Get('teacher-context')
  async getTeacherContext(@CurrentUser() user: CurrentUserPayload) {
    return this.marksService.getTeacherContext(user.schoolId!, user.userId, user.role);
  }

  @Get('exam-terms')
  async listExamTerms(@CurrentUser() user: CurrentUserPayload) {
    return this.marksService.listExamTerms(user.schoolId!);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('exam-terms')
  async createExamTerm(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateExamTermDto,
  ) {
    return this.marksService.createExamTerm(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('paper-schedules')
  async savePaperSchedules(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SavePaperSchedulesDto,
  ) {
    return this.marksService.savePaperSchedules(user.schoolId!, dto);
  }

  @Get('paper-schedules')
  async getPaperSchedules(
    @CurrentUser() user: CurrentUserPayload,
    @Query('examTermId') examTermId: string,
    @Query('classId') classId: string,
  ) {
    return this.marksService.getPaperSchedules(user.schoolId!, examTermId, classId);
  }

  @Get('roll-no-slips')
  async generateRollNoSlips(
    @CurrentUser() user: CurrentUserPayload,
    @Query('examTermId') examTermId: string,
    @Query('classId') classId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.marksService.generateRollNoSlips(user.schoolId!, examTermId, classId, sectionId);
  }

  @Get('roll-no-slip/:studentId')
  async generateSingleRollNoSlip(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Query('examTermId') examTermId: string,
    @Query('isRetake') isRetake?: string,
  ) {
    return this.marksService.generateSingleRollNoSlip(
      user.schoolId!,
      examTermId,
      studentId,
      isRetake === 'true',
    );
  }

  @Get('section-marks')
  async getSectionMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Query('sectionId') sectionId: string,
    @Query('examTermId') examTermId: string,
    @Query('subjectId') subjectId: string,
  ) {
    return this.marksService.getSectionMarks(user.schoolId!, sectionId, examTermId, subjectId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('save')
  async saveMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SaveMarksDto,
  ) {
    return this.marksService.saveMarks(user.schoolId!, { userId: user.userId, role: user.role }, dto);
  }

  @Get('analytics')
  async getExamAnalytics(
    @CurrentUser() user: CurrentUserPayload,
    @Query('examTermId') examTermId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.marksService.getExamAnalytics(user.schoolId!, examTermId, sectionId);
  }

  @Get('batch-report-cards')
  async getBatchReportCards(
    @CurrentUser() user: CurrentUserPayload,
    @Query('examTermId') examTermId: string,
    @Query('sectionId') sectionId: string,
  ) {
    return this.marksService.getBatchReportCards(user.schoolId!, examTermId, sectionId);
  }

  @Get('report-card/:studentId')
  async getReportCard(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Query('examTermId') examTermId?: string,
  ) {
    return this.marksService.getStudentReportCard(user.schoolId!, studentId, examTermId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Exam Question Papers
  // ─────────────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('question-papers')
  async createQuestionPaper(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateQuestionPaperDto,
  ) {
    return this.marksService.createQuestionPaper(user.schoolId!, { userId: user.userId, role: user.role }, dto);
  }

  @Get('question-papers')
  async getQuestionPapers(
    @CurrentUser() user: CurrentUserPayload,
    @Query('examTermId') examTermId?: string,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.marksService.getQuestionPapers(user.schoolId!, examTermId, classId, subjectId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch('question-papers/:id/set-active')
  async setActiveQuestionPaper(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.marksService.setActiveQuestionPaper(user.schoolId!, id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete('question-papers/:id')
  async deleteQuestionPaper(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.marksService.deleteQuestionPaper(user.schoolId!, id);
  }

  @Get('question-paper/print/:id')
  async getPrintableQuestionPaper(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.marksService.getPrintableQuestionPaper(user.schoolId!, id);
  }
}
