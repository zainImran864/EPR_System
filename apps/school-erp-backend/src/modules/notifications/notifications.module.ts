import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification, NotificationSchema } from '../../database/schemas/notification.schema';

const isJestVm = Boolean(process.env.JEST_WORKER_ID);

@Module({
  imports: [
    ...(isJestVm ? [] : [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
