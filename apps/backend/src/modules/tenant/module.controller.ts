import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Req, BadRequestException } from '@nestjs/common';
import { ModuleService } from './module.service';
import { PrismaClient } from '@prisma/client';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';

// Version-proof types derived from client methods
type ModuleCreateData = Parameters<PrismaClient['module']['create']>[0] extends { data: infer D } ? D : never;
type ModuleUpdateData = Parameters<PrismaClient['module']['update']>[0] extends { data: infer D } ? D : never;

// DTO for creating a module
interface CreateModuleDto {
  code: string;
  name: string;
  name_hindi?: string;
  route?: string;
  icon?: string;
  portal: 'ADMIN' | 'DEPARTMENT' | 'APPLICANT';
  order?: number;
  is_leaf?: boolean;
  is_active?: boolean;
  parent_id?: number | string;
  tenant_id?: number | string;
  tenant_project_id?: number | string;
  department_id?: string | number | bigint;
  sub_department_id?: string | number | bigint;
}

const toOptionalInt = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new BadRequestException(`Invalid integer value: ${value}`);
    }
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (!/^-?\d+$/.test(trimmed)) {
      throw new BadRequestException(`Invalid integer value: ${value}`);
    }

    return parseInt(trimmed, 10);
  }

  throw new BadRequestException(`Invalid integer value: ${value}`);
};

const toOptionalBigInt = (value: unknown): bigint | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new BadRequestException(`Invalid bigint value: ${value}`);
    }
    return BigInt(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (!/^-?\d+$/.test(trimmed)) {
      throw new BadRequestException(`Invalid bigint value: ${value}`);
    }

    return BigInt(trimmed);
  }

  throw new BadRequestException(`Invalid bigint value: ${value}`);
};

const toNullableInt = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return toOptionalInt(value) ?? null;
};

const toNullableBigInt = (value: unknown): bigint | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return toOptionalBigInt(value) ?? null;
};

@Controller('modules')
@SkipResourceCheck()
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post()
  async create(@Body() createModuleDto: CreateModuleDto, @Req() req: Record<string, unknown>) {
    // If tenant_id is not provided, try to get it from the request
    // For now, default to tenant_id: 1 if not provided (assumes single tenant or admin context)
    const tenantId =
      toOptionalInt(createModuleDto.tenant_id) ||
      toOptionalInt(req.tenant_id) ||
      1;

    if (!tenantId) {
      throw new BadRequestException('tenant_id is required');
    }

    const submitData: ModuleCreateData = {
      code: createModuleDto.code,
      name: createModuleDto.name,
      portal: createModuleDto.portal,
      tenant_id: tenantId,
      is_active: createModuleDto.is_active ?? true,
    };

    if (createModuleDto.name_hindi) {
      submitData.name_hindi = createModuleDto.name_hindi;
    }
    if (createModuleDto.route) {
      submitData.route = createModuleDto.route;
    }
    if (createModuleDto.icon) {
      submitData.icon = createModuleDto.icon;
    }
    if (createModuleDto.order !== undefined) {
      submitData.order = createModuleDto.order;
    }
    if (createModuleDto.is_leaf !== undefined) {
      submitData.is_leaf = createModuleDto.is_leaf;
    }
    if (createModuleDto.parent_id) {
      submitData.parent_id = toOptionalInt(createModuleDto.parent_id) ?? undefined;
    }

    const tenantProjectId = toOptionalInt(createModuleDto.tenant_project_id);
    if (tenantProjectId !== undefined) {
      submitData.tenant_project_id = tenantProjectId;
    }

    const departmentId = toOptionalBigInt(createModuleDto.department_id);
    if (departmentId !== undefined) {
      submitData.department_id = departmentId;
    }

    const subDepartmentId = toOptionalBigInt(createModuleDto.sub_department_id);
    if (subDepartmentId !== undefined) {
      submitData.sub_department_id = subDepartmentId;
    }

    return this.moduleService.create(submitData);
  }

  @Get()
  findAll() {
    return this.moduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moduleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateModuleDto: ModuleUpdateData & {
      tenant_id?: number | string;
      parent_id?: number | string;
      tenant_project_id?: number | string;
      department_id?: string | number | bigint;
      sub_department_id?: string | number | bigint;
    },
  ) {
    const {
      tenant_id,
      parent_id,
      tenant_project_id,
      department_id,
      sub_department_id,
      ...rest
    } = updateModuleDto;

    const submitData: ModuleUpdateData = { ...rest };

    if ('tenant_id' in updateModuleDto) {
      const tenantIdValue = toNullableInt(tenant_id);
      if (tenantIdValue !== undefined) {
        submitData.tenant_id = tenantIdValue;
      }
    }

    if ('parent_id' in updateModuleDto) {
      const parentIdValue = toNullableInt(parent_id);
      if (parentIdValue !== undefined) {
        submitData.parent_id = parentIdValue;
      }
    }

    if ('tenant_project_id' in updateModuleDto) {
      const tenantProjectIdValue = toNullableInt(tenant_project_id);
      if (tenantProjectIdValue !== undefined) {
        submitData.tenant_project_id = tenantProjectIdValue;
      }
    }

    if ('department_id' in updateModuleDto) {
      const departmentIdValue = toNullableBigInt(department_id);
      if (departmentIdValue !== undefined) {
        submitData.department_id = departmentIdValue;
      }
    }

    if ('sub_department_id' in updateModuleDto) {
      const subDepartmentIdValue = toNullableBigInt(sub_department_id);
      if (subDepartmentIdValue !== undefined) {
        submitData.sub_department_id = subDepartmentIdValue;
      }
    }

    return this.moduleService.update(id, submitData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moduleService.remove(id);
  }
}
