import 'reflect-metadata';
import { IsInt, validateSync, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform, plainToInstance } from 'class-transformer';

export class CreateMasterDefinitionDto {
  @IsInt()
  tenant_id: number;
}

const payload = {
  tenant_id: undefined,
};

const instance = plainToInstance(CreateMasterDefinitionDto, payload);
const errors = validateSync(instance);
console.log(JSON.stringify(errors, null, 2));
