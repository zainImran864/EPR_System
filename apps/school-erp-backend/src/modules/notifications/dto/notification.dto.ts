import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  type?: string; // 'info', 'warning', 'success', 'urgent'

  @IsOptional()
  @IsString()
  kind?: string;

  @IsOptional()
  @IsString()
  targetRole?: string; // 'ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'

  @IsOptional()
  @IsString()
  audienceRole?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  targetClassId?: string;
}
