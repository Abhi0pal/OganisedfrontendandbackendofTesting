import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  countryName?: string;

  @IsOptional()
  @IsString()
  stateName?: string;

  @IsOptional()
  @IsString()
  cityName?: string;

  @IsOptional()
  @IsString()
  districtName?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  panCard?: string;

  @IsOptional()
  @IsString()
  adhaarNumber?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  legalEntityName?: string;

  @IsOptional()
  @IsString()
  consPanCard?: string;

  @IsOptional()
  @IsString()
  consFirstName?: string;

  @IsOptional()
  @IsString()
  consLastName?: string;

  @IsOptional()
  @IsString()
  consCountryName?: string;

  @IsOptional()
  @IsString()
  consStateName?: string;
}
