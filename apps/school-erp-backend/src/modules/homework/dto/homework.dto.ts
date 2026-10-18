import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateHomeworkDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxMarks?: number;
}

export class SubmitHomeworkDto {
  @IsString()
  @IsOptional()
  submissionUrl?: string;

  @IsString()
  @IsOptional()
  content?: string;
}

export class GradeSubmissionDto {
  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class QueryHomeworkDto {
  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;
}
