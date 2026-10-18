import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
  @Min(0.01, { message: 'Fee amount must be greater than zero' })
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fineAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeeAmount?: number;

  @IsOptional()
  @IsString()
  customNotes?: string;
}

export class PayChallanDto {
  @IsNumber()
  @Min(0.01, { message: 'Paid amount must be greater than zero' })
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
  @Min(0.01, { message: 'Fee amount must be greater than zero' })
  amount: number;

  @IsOptional()
  @IsNumber()
  fineAmount?: number;

  @IsOptional()
  @IsNumber()
  lateFeeAmount?: number;

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

export class SetLateFeePolicyDto {
  @IsNumber()
  lateFeeAmount: number;
}
