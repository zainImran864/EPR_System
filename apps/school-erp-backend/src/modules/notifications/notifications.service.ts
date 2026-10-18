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
  clearedBy: string[];
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
          $and: [
            {
              $or: [
                { schoolId, targetRole: 'ALL' },
                { schoolId, targetRole: role },
                { schoolId, targetUserId: userId },
                { schoolId, targetRole: { $exists: false } },
              ],
            },
            {
              clearedBy: { $ne: userId },
            },
          ],
        };
        const docs = await this.notificationModel.find(query).sort({ createdAt: -1 }).limit(100).exec();
        return docs.map((d) => {
          const rawCreated = (d as any).createdAt || (d as any).get?.('createdAt');
          let isoCreated: string;
          try {
            const parsedTime = rawCreated ? new Date(rawCreated).getTime() : NaN;
            isoCreated = !isNaN(parsedTime) ? new Date(parsedTime).toISOString() : new Date().toISOString();
          } catch {
            isoCreated = new Date().toISOString();
          }
          return {
            _id: d._id.toString(),
            id: d._id.toString(),
            title: d.title,
            message: d.message,
            body: d.message,
            type: d.type,
            kind: d.type,
            targetRole: d.targetRole,
            audienceRole: d.targetRole,
            createdAt: isoCreated,
            isRead: Array.isArray(d.readBy) && d.readBy.includes(userId),
          };
        });
      } catch {}
    }

    // Memory fallback
    return this.memoryNotifications
      .filter(
        (n) =>
          n.schoolId === schoolId &&
          (n.targetRole === 'ALL' || n.targetRole === role || n.targetUserId === userId) &&
          (!Array.isArray(n.clearedBy) || !n.clearedBy.includes(userId)),
      )
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
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : new Date().toISOString(),
        isRead: Array.isArray(n.readBy) && n.readBy.includes(userId),
      }));
  }

  async createNotification(schoolId: string, dto: CreateNotificationDto) {
    const resolvedMessage = dto.message || dto.body || '';
    const resolvedType = dto.type || dto.kind || 'info';
    const rawRole = dto.targetRole || dto.audienceRole || 'ALL';
    const resolvedRole = rawRole.toUpperCase() === 'ALL' ? 'ALL' : rawRole.toUpperCase();

    const now = new Date();
    const payload = {
      schoolId,
      title: dto.title,
      message: resolvedMessage,
      type: resolvedType,
      targetRole: resolvedRole,
      targetUserId: dto.targetUserId,
      targetClassId: dto.targetClassId,
      readBy: [],
      clearedBy: [],
      createdAt: now,
    };

    if (this.notificationModel) {
      try {
        const created = await this.notificationModel.create(payload);
        await this.redisService.publish(`notifications:${schoolId}`, {
          ...payload,
          _id: created._id.toString(),
          createdAt: now.toISOString(),
        });
        return created;
      } catch {}
    }

    const memoryItem: MemoryNotification = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...payload,
    };
    this.memoryNotifications.unshift(memoryItem);
    await this.redisService.publish(`notifications:${schoolId}`, {
      ...payload,
      _id: memoryItem._id,
      createdAt: now.toISOString(),
    });
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

  async markAllAsRead(schoolId: string, userId: string, role: string) {
    if (this.notificationModel) {
      try {
        await this.notificationModel.updateMany(
          {
            schoolId,
            $or: [
              { targetRole: 'ALL' },
              { targetRole: role },
              { targetUserId: userId },
              { targetRole: { $exists: false } },
            ],
            readBy: { $ne: userId },
          },
          {
            $addToSet: { readBy: userId },
          },
        );
        return { success: true };
      } catch {}
    }

    for (const item of this.memoryNotifications) {
      if (
        item.schoolId === schoolId &&
        (item.targetRole === 'ALL' || item.targetRole === role || item.targetUserId === userId)
      ) {
        if (!item.readBy.includes(userId)) {
          item.readBy.push(userId);
        }
      }
    }
    return { success: true };
  }

  async clearAllNotifications(schoolId: string, userId: string, role: string) {
    if (this.notificationModel) {
      try {
        await this.notificationModel.updateMany(
          {
            schoolId,
            $or: [
              { targetRole: 'ALL' },
              { targetRole: role },
              { targetUserId: userId },
              { targetRole: { $exists: false } },
            ],
            clearedBy: { $ne: userId },
          },
          {
            $addToSet: { clearedBy: userId },
          },
        );
        return { success: true };
      } catch {}
    }

    for (const item of this.memoryNotifications) {
      if (
        item.schoolId === schoolId &&
        (item.targetRole === 'ALL' || item.targetRole === role || item.targetUserId === userId)
      ) {
        if (!item.clearedBy) item.clearedBy = [];
        if (!item.clearedBy.includes(userId)) {
          item.clearedBy.push(userId);
        }
      }
    }
    return { success: true };
  }
}
