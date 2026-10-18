import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsNotEmpty()
  meetingDate: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  timeSlot: string; // e.g. "10:00 AM"

  @IsString()
  @IsOptional()
  mode?: string; // IN_PERSON, ONLINE

  @IsString()
  @IsNotEmpty()
  agenda: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateMeetingStatusDto {
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus; // APPROVED, REJECTED

  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryMeetingDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  studentId?: string;
}
