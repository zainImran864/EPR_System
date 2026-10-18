import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  studentContactEmail?: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsOptional()
  @IsString()
  rollNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string; // Optional student picture for roll number slips and ID cards

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  customMonthlyFee?: number;

  @IsOptional()
  @IsString()
  discountReason?: string;

  // Parent / Guardian Information (supports both parent* and guardian* field names)
  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @IsOptional()
  @IsString()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  rollNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsOptional()
  @IsString()
  parentEmail?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  customMonthlyFee?: number;

  @IsOptional()
  @IsString()
  discountReason?: string;
}

export class UpdateStudentStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // active, inactive, alumni
}

export class PromoteStudentDto {
  @IsOptional()
  @IsString()
  targetClassId?: string;

  @IsOptional()
  @IsString()
  targetSectionId?: string;
}

export class DemoteStudentDto {
  @IsOptional()
  @IsString()
  targetClassId?: string;

  @IsOptional()
  @IsString()
  targetSectionId?: string;
}

export class AutoProgressionDto {
  @IsString()
  @IsNotEmpty()
  finalExamTermId: string;

  @IsOptional()
  @IsNumber()
  passingThreshold?: number; // default 40%

  @IsOptional()
  @IsBoolean()
  autoPromotePassing?: boolean; // default true
}

export enum ProgressionAction {
  PROMOTE = 'PROMOTE',
  RETAIN = 'RETAIN',
  DEMOTE = 'DEMOTE',
}

export class ProgressionDecisionDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(ProgressionAction)
  action: ProgressionAction;

  @IsOptional()
  @IsString()
  targetClassId?: string;

  @IsOptional()
  @IsString()
  targetSectionId?: string;
}
