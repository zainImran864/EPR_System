import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamTermDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
