import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: false, index: true })
  schoolId?: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'info', enum: ['info', 'warning', 'success', 'urgent'] })
  type: string;

  @Prop({ required: false, enum: ['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] })
  targetRole?: string;

  @Prop({ required: false, index: true })
  targetUserId?: string;

  @Prop({ required: false, index: true })
  targetClassId?: string;

  @Prop({ type: [String], default: [] })
  readBy: string[]; // List of user IDs who have acknowledged/read the notification
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ schoolId: 1, createdAt: -1 });
