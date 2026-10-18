import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateCircularDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  targetType: string; // 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS' | 'SECTION'

  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}

export class QueryCircularDto {
  @IsString()
  @IsOptional()
  targetType?: string;

  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;
}
