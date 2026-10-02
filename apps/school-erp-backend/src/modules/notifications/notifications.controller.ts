import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async listNotifications(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.listNotifications(user.schoolId!, user.userId, user.role);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Post()
  async createNotification(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.createNotification(user.schoolId!, dto);
  }

  @Post(':id/read')
  async markAsRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(id, user.userId);
  }
}
