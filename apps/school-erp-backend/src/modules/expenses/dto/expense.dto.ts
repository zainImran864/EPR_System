import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  expenseDate?: string; // e.g. "2026-10-18"

  @IsOptional()
  @IsString()
  month?: string; // e.g. "October 2026"

  @IsOptional()
  @IsString()
  academicYear?: string; // e.g. "2026-2027"

  @IsOptional()
  @IsString()
  paymentMethod?: string; // "Cash", "Bank Transfer", "Cheque", "Online"

  @IsOptional()
  @IsString()
  recipientName?: string; // Vendor, Utility Provider, or Staff Member Name

  @IsOptional()
  @IsString()
  invoiceNumber?: string; // Bill or Invoice reference

  @IsOptional()
  @IsString()
  receiptUrl?: string; // Receipt / voucher image or scan

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ExpenseQueryDto {
  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;
}

export class TrackingQueryDto {
  @IsOptional()
  @IsString()
  rangeType?: 'monthly' | 'yearly' | 'custom';

  @IsOptional()
  @IsString()
  month?: string; // e.g. "October 2026"

  @IsOptional()
  @IsString()
  year?: string; // e.g. "2026" or "2026-2027"

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
