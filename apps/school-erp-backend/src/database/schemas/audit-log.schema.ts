import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: false, index: true })
  schoolId?: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true, index: true })
  action: string; // e.g. "STUDENT_CREATED", "MARKS_UPDATED", "ATTENDANCE_MARKED"

  @Prop({ required: true, index: true })
  module: string; // "students", "teachers", "marks", "attendance", "fees"

  @Prop({ type: Object, required: false })
  details?: Record<string, any>;

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ required: false })
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ schoolId: 1, createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1 });
