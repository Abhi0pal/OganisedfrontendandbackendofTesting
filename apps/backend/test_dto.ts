import 'reflect-metadata';
import { IsInt, validateSync, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform, plainToInstance } from 'class-transformer';

const toInt = ({ value }: { value: any }) => {
  console.log("toInt called with:", value, typeof value);
  return value === null || value === undefined || value === 'undefined' || value === 'null' || value === '' ? undefined : Number(value);
};

export class CreateMasterDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Transform(toInt)
  @IsInt()
  tenant_id: number;

  @Transform(toInt)
  @IsInt()
  project_id: number;
}

const payload = {
  name: "Test Master",
  description: "TEST",
  tenant_id: "6", // string test
  project_id: "5" // string test
};

const instance = plainToInstance(CreateMasterDefinitionDto, payload);
console.log("Instance:", instance);
const errors = validateSync(instance);
console.log("Errors:", errors);
