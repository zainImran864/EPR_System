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
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingStatusDto, QueryMeetingDto } from './dto/meeting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('parent-meetings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async createMeeting(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.createMeeting(
      {
        id: user.userId,
        role: user.role as Role,
        schoolId: user.schoolId!,
        name: user.name,
        studentContext: user.studentContext,
      },
      dto,
    );
  }

  @Get()
  async listMeetings(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryMeetingDto,
  ) {
    return this.meetingsService.listMeetings(
      {
        id: user.userId,
        role: user.role as Role,
        schoolId: user.schoolId!,
        studentContext: user.studentContext,
      },
      query,
    );
  }

  @Patch(':id/status')
  async updateMeetingStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMeetingStatusDto,
  ) {
    return this.meetingsService.updateMeetingStatus(
      id,
      {
        id: user.userId,
        role: user.role as Role,
        name: user.name,
      },
      dto,
    );
  }
}
