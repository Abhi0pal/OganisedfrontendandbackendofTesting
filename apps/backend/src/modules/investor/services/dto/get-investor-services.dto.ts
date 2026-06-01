import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetInvestorServicesDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  departmentId: number;

  @IsNotEmpty()
  @IsString()
  categoryType: string;
}