import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum WhatsAppRecipientType {
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  CUSTOM = 'CUSTOM',
}

export enum WhatsAppTemplateType {
  CUSTOM = 'CUSTOM',
  REPORT_CARD = 'REPORT_CARD',
  FEE_REMINDER = 'FEE_REMINDER',
  ATTENDANCE_ALERT = 'ATTENDANCE_ALERT',
  EXAM_NOTICE = 'EXAM_NOTICE',
  GENERAL_ANNOUNCEMENT = 'GENERAL_ANNOUNCEMENT',
}

export class SendDirectWhatsAppDto {
  @IsEnum(WhatsAppRecipientType)
  recipientType: WhatsAppRecipientType;

  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsEnum(WhatsAppTemplateType)
  templateType?: WhatsAppTemplateType;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}

export class SendBatchWhatsAppDto {
  @IsString()
  @IsNotEmpty()
  targetGroup: 'CLASS_PARENTS' | 'SECTION_PARENTS' | 'ALL_PARENTS' | 'ALL_TEACHERS';

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsEnum(WhatsAppTemplateType)
  templateType?: WhatsAppTemplateType;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SendReportCardWhatsAppDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsString()
  examTermId?: string;

  @IsOptional()
  @IsString()
  customRemarks?: string;
}

export class SendFeeReminderWhatsAppDto {
  @IsString()
  @IsNotEmpty()
  challanId: string;
}

export class SendAttendanceAlertWhatsAppDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  status?: string; // ABSENT, LATE
}
