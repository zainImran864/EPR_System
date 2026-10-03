import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChallanDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  fineAmount?: number;

  @IsOptional()
  @IsString()
  customNotes?: string;
}

export class PayChallanDto {
  @IsNumber()
  paidAmount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // "Cash", "Bank Transfer", "Online"
}

export class GenerateBulkChallansDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  month: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsBoolean()
  applyStudentDiscounts?: boolean;
}

export class SetStudentDiscountDto {
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
