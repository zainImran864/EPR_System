import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../database/schemas/audit-log.schema';

export interface MemoryAudit {
  id: string;
  schoolId?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  private memoryLogs: MemoryAudit[] = [];

  constructor(
    @Optional() @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument> | null,
  ) {}

  async logAction(entry: {
    schoolId?: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    module: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    if (this.auditModel) {
      try {
        return await this.auditModel.create(entry);
      } catch {}
    }

    const item: MemoryAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...entry,
      createdAt: new Date(),
    };
    this.memoryLogs.unshift(item);
    return item;
  }

  async listLogs(schoolId: string, limit = 100) {
    if (this.auditModel) {
      try {
        return await this.auditModel.find({ schoolId }).sort({ createdAt: -1 }).limit(limit).exec();
      } catch {}
    }

    return this.memoryLogs.filter((l) => l.schoolId === schoolId).slice(0, limit);
  }
}
