import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class TestDto {
  @Type(() => Number)
  @IsInt()
  tenant_id: number;
}

async function run() {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  
  try {
    const result = await pipe.transform({ tenant_id: 6 }, { type: 'body', metatype: TestDto });
    console.log("Success with number 6:", result);
  } catch (e: any) {
    console.error("Failed with number 6:", e.response?.message || e.message);
  }

  try {
    const result = await pipe.transform({ tenant_id: "6" }, { type: 'body', metatype: TestDto });
    console.log("Success with string '6':", result);
  } catch (e: any) {
    console.error("Failed with string '6':", e.response?.message || e.message);
  }

  try {
    const result = await pipe.transform({ tenant_id: null }, { type: 'body', metatype: TestDto });
    console.log("Success with null:", result);
  } catch (e: any) {
    console.error("Failed with null:", e.response?.message || e.message);
  }

  try {
    const result = await pipe.transform({ }, { type: 'body', metatype: TestDto });
    console.log("Success with undefined:", result);
  } catch (e: any) {
    console.error("Failed with undefined:", e.response?.message || e.message);
  }
}

run();
