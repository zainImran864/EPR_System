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
          _id: d._id.toString(),
          id: d._id.toString(),
          title: d.title,
          message: d.message,
          body: d.message,
          type: d.type,
          kind: d.type,
          targetRole: d.targetRole,
          audienceRole: d.targetRole,
          createdAt: (d as any).createdAt,
          isRead: d.readBy.includes(userId),
        }));
      } catch {}
    }

    // Memory fallback
    return this.memoryNotifications
      .filter((n) => n.schoolId === schoolId && (n.targetRole === 'ALL' || n.targetRole === role || n.targetUserId === userId))
      .map((n) => ({
        _id: n._id,
        id: n._id,
        title: n.title,
        message: n.message,
        body: n.message,
        type: n.type,
        kind: n.type,
        targetRole: n.targetRole,
        audienceRole: n.targetRole,
        createdAt: n.createdAt,
        isRead: n.readBy.includes(userId),
      }));
  }

  async createNotification(schoolId: string, dto: CreateNotificationDto) {
    const resolvedMessage = dto.message || dto.body || '';
    const resolvedType = dto.type || dto.kind || 'info';
    const rawRole = dto.targetRole || dto.audienceRole || 'ALL';
    const resolvedRole = rawRole.toUpperCase() === 'ALL' ? 'ALL' : rawRole.toUpperCase();

    const payload = {
      schoolId,
      title: dto.title,
      message: resolvedMessage,
      type: resolvedType,
      targetRole: resolvedRole,
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
