import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  schoolCode?: string;

  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}

export class RegisterSchoolDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsOptional()
  @IsString()
  schoolSlug?: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsArray()
  classesOffered: number[];

  @IsOptional()
  @IsNumber()
  totalTeachers?: number;

  @IsOptional()
  @IsNumber()
  totalStudents?: number;

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  adminPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class UpdateThemeDto {
  @IsString()
  @IsNotEmpty()
  themeColor: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TwoFactorVerifyDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
