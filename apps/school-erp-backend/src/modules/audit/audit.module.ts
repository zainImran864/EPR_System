import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog, AuditLogSchema } from '../../database/schemas/audit-log.schema';

const isJestVm = Boolean(process.env.JEST_WORKER_ID);

@Module({
  imports: [
    ...(isJestVm ? [] : [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
