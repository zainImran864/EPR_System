import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { FeeStatus } from '@prisma/client';

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
  fineAmount?: number;
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
}
