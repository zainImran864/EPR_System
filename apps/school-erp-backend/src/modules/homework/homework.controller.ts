import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import {
  CreateHomeworkDto,
  SubmitHomeworkDto,
  GradeSubmissionDto,
  QueryHomeworkDto,
} from './dto/homework.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('homework')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  async createHomework(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateHomeworkDto,
  ) {
    return this.homeworkService.createHomework(
      {
        id: user.userId,
        role: user.role as Role,
        schoolId: user.schoolId!,
        name: user.name,
      },
      dto,
    );
  }

  @Get()
  async listHomework(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryHomeworkDto,
  ) {
    return this.homeworkService.listHomework(
      {
        id: user.userId,
        role: user.role as Role,
        schoolId: user.schoolId!,
        studentContext: user.studentContext,
      },
      query,
    );
  }

  @Get(':id')
  async getHomeworkById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.homeworkService.getHomeworkById(id, {
      id: user.userId,
      role: user.role as Role,
      schoolId: user.schoolId!,
    });
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT, Role.PARENT)
  async submitHomework(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubmitHomeworkDto,
  ) {
    return this.homeworkService.submitHomework(
      id,
      {
        id: user.userId,
        role: user.role as Role,
        studentContext: user.studentContext,
      },
      dto,
    );
  }

  @Patch('submission/:id/grade')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  async gradeSubmission(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.homeworkService.gradeSubmission(
      id,
      {
        id: user.userId,
        role: user.role as Role,
        name: user.name,
      },
      dto,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  async deleteHomework(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.homeworkService.deleteHomework(id, {
      id: user.userId,
      role: user.role as Role,
    });
  }
}
