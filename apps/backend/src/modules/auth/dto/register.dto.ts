import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(60)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(60)
  lastName: string;

  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  stakeholderType?: string;

  @IsOptional()
  tenant?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  otpVerificationToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  pan?: string;

  @IsOptional()
  @Matches(/^\d{10}$/)
  mobile?: string;

  @IsOptional()
  @MaxLength(255)
  legalEntityName?: string;

  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  state?: string;

  @IsOptional()
  district?: string;

  @IsOptional()
  pinCode?: string;

  @IsOptional()
  cons_pan?: string;

  @IsOptional()
  cons_mobile?: string;

  @IsOptional()
  cons_fullName?: string;

  @IsOptional()
  cons_email?: string;

  @IsOptional()
  cons_country?: string;

  @IsOptional()
  cons_state?: string;
}
