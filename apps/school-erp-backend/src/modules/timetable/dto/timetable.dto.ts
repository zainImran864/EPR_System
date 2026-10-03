import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, Max, Min } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateTimetableEntryDto {
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsInt()
  @Min(1)
  @Max(10)
  periodNumber: number;

  @IsString()
  @IsNotEmpty()
  startTime: string; // "08:30"

  @IsString()
  @IsNotEmpty()
  endTime: string; // "09:15"

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsBoolean()
  allowCombinedClass?: boolean; // When true, allows assigning the same teacher/room across multiple classes simultaneously

  @IsOptional()
  @IsBoolean()
  allowSharedRoom?: boolean; // Supports 2 or more classes sharing the same room (e.g. Auditorium, Gym, Lab)
}
