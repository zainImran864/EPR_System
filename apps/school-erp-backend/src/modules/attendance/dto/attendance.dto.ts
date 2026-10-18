import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, RequestStatus } from '@prisma/client';

export class SingleAttendanceEntryDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkAttendanceDto {
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleAttendanceEntryDto)
  records: SingleAttendanceEntryDto[];
}

export class MarkTeacherAttendanceDto {
  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD, defaults to today

  @IsString()
  @IsNotEmpty()
  photoUrl: string; // Base64 data URL or uploaded image URL

  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsString()
  addressLabel?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateSchoolLocationDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  geofenceRadiusMeters?: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class ApplyTeacherLeaveDto {
  @IsString()
  @IsNotEmpty()
  leaveType: string; // SICK, CASUAL, EMERGENCY, OFFICIAL, OTHER

  @IsString()
  @IsNotEmpty()
  startDate: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  endDate: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReviewTeacherLeaveDto {
  @IsEnum(RequestStatus)
  status: RequestStatus; // APPROVED or REJECTED

  @IsOptional()
  @IsString()
  adminRemarks?: string;
}

export class CreateQrSessionDto {
  @IsOptional()
  @IsString()
  mode?: 'TEACHER_CHECKIN' | 'ADMIN_SET_LOCATION';

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class SubmitQrSessionDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  geofenceRadiusMeters?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApplyStudentLeaveDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  startDate: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  endDate: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ReviewStudentLeaveDto {
  @IsEnum(RequestStatus)
  status: RequestStatus; // APPROVED or REJECTED

  @IsOptional()
  @IsString()
  reviewRemarks?: string;
}

