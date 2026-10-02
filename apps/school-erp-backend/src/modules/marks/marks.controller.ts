import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MarksService } from './marks.service';
import { CreateExamTermDto, SaveMarksDto } from './dto/marks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('marks')
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

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
    return this.marksService.saveMarks(user.schoolId!, dto);
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
    @Query('examTermId') examTermId: string,
  ) {
    return this.marksService.getStudentReportCard(user.schoolId!, studentId, examTermId);
  }
}
