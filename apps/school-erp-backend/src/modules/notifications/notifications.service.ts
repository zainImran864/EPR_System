import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import { RedisService } from '../../database/redis.service';
import { CreateNotificationDto } from './dto/notification.dto';

export interface MemoryNotification {
  _id: string;
  schoolId?: string;
  title: string;
  message: string;
  type: string;
  targetRole?: string;
  targetUserId?: string;
  targetClassId?: string;
  readBy: string[];
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  private memoryNotifications: MemoryNotification[] = [];

  constructor(
    @Optional() @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument> | null,
    private readonly redisService: RedisService,
  ) {}

  async listNotifications(schoolId: string, userId: string, role: string) {
    if (this.notificationModel) {
      try {
        const query: any = {
          $or: [
            { schoolId, targetRole: 'ALL' },
            { schoolId, targetRole: role },
            { schoolId, targetUserId: userId },
            { schoolId, targetRole: { $exists: false } },
          ],
        };
        const docs = await this.notificationModel.find(query).sort({ createdAt: -1 }).limit(50).exec();
        return docs.map((d) => ({
          id: d._id.toString(),
          title: d.title,
          message: d.message,
          type: d.type,
          targetRole: d.targetRole,
          createdAt: (d as any).createdAt,
          isRead: d.readBy.includes(userId),
        }));
      } catch {}
    }

    // Memory fallback
    return this.memoryNotifications
      .filter((n) => n.schoolId === schoolId && (n.targetRole === 'ALL' || n.targetRole === role || n.targetUserId === userId))
      .map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        targetRole: n.targetRole,
        createdAt: n.createdAt,
        isRead: n.readBy.includes(userId),
      }));
  }

  async createNotification(schoolId: string, dto: CreateNotificationDto) {
    const payload = {
      schoolId,
      title: dto.title,
      message: dto.message,
      type: dto.type || 'info',
      targetRole: dto.targetRole || 'ALL',
      targetUserId: dto.targetUserId,
      targetClassId: dto.targetClassId,
      readBy: [],
      createdAt: new Date(),
    };

    if (this.notificationModel) {
      try {
        const created = await this.notificationModel.create(payload);
        await this.redisService.publish(`notifications:${schoolId}`, payload);
        return created;
      } catch {}
    }

    const memoryItem: MemoryNotification = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...payload,
    };
    this.memoryNotifications.unshift(memoryItem);
    await this.redisService.publish(`notifications:${schoolId}`, payload);
    return memoryItem;
  }

  async markAsRead(notificationId: string, userId: string) {
    if (this.notificationModel) {
      try {
        await this.notificationModel.findByIdAndUpdate(notificationId, {
          $addToSet: { readBy: userId },
        });
        return { success: true };
      } catch {}
    }

    const item = this.memoryNotifications.find((n) => n._id === notificationId);
    if (item && !item.readBy.includes(userId)) {
      item.readBy.push(userId);
    }
    return { success: true };
  }
}
