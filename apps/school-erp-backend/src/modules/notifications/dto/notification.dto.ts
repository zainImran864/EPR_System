import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  type?: string; // 'info', 'warning', 'success', 'urgent'

  @IsOptional()
  @IsString()
  targetRole?: string; // 'ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  targetClassId?: string;
}
