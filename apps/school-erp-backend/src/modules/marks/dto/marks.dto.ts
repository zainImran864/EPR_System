import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamTermDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  termType?: string; // MID_TERM, MID_TERM_2, FINAL_TERM, SUPPLEMENTARY

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class StudentMarkEntryDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  obtainedMarks: number;

  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class SaveMarksDto {
  @IsString()
  @IsNotEmpty()
  examTermId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentMarkEntryDto)
  entries: StudentMarkEntryDto[];
}

export class PaperScheduleEntryDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsDateString()
  examDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string; // "09:00"

  @IsString()
  @IsNotEmpty()
  endTime: string; // "12:00"

  @IsOptional()
  @IsString()
  roomNo?: string;

  @IsOptional()
  @IsNumber()
  totalMarks?: number;
}

export class SavePaperSchedulesDto {
  @IsString()
  @IsNotEmpty()
  examTermId: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaperScheduleEntryDto)
  schedules: PaperScheduleEntryDto[];
}
