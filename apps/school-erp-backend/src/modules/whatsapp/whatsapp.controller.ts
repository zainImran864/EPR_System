import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import {
  SendDirectWhatsAppDto,
  SendBatchWhatsAppDto,
  SendReportCardWhatsAppDto,
  SendFeeReminderWhatsAppDto,
  SendAttendanceAlertWhatsAppDto,
} from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get('recipients')
  async getRecipients(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
  ) {
    return this.whatsAppService.getRecipients(user.schoolId!, search);
  }

  @Get('templates')
  getTemplates() {
    return this.whatsAppService.getTemplates();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('send-direct')
  async prepareDirectMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendDirectWhatsAppDto,
  ) {
    return this.whatsAppService.prepareDirectMessage(
      user.schoolId!,
      { userId: user.userId, role: user.role },
      dto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('send-report-card')
  async sendReportCardWhatsApp(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendReportCardWhatsAppDto,
  ) {
    return this.whatsAppService.sendReportCardWhatsApp(
      user.schoolId!,
      { userId: user.userId, role: user.role },
      dto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('send-fee-reminder')
  async sendFeeReminderWhatsApp(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendFeeReminderWhatsAppDto,
  ) {
    return this.whatsAppService.sendFeeReminderWhatsApp(
      user.schoolId!,
      { userId: user.userId, role: user.role },
      dto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('send-attendance-alert')
  async sendAttendanceAlertWhatsApp(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendAttendanceAlertWhatsAppDto,
  ) {
    return this.whatsAppService.sendAttendanceAlertWhatsApp(
      user.schoolId!,
      { userId: user.userId, role: user.role },
      dto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('send-batch')
  async prepareBatchMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendBatchWhatsAppDto,
  ) {
    return this.whatsAppService.prepareBatchMessages(
      user.schoolId!,
      { userId: user.userId, role: user.role },
      dto,
    );
  }
}
