import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaClient } from '@prisma/client';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';

type TenantProjectCreateData = Parameters<PrismaClient['tenantProject']['create']>[0] extends {
  data: infer D;
}
  ? D
  : never;
type TenantProjectUpdateData = Parameters<PrismaClient['tenantProject']['update']>[0] extends {
  data: infer D;
}
  ? D
  : never;

// DTO for creating a project
interface CreateProjectDto {
  name: string;
  code: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  tenant_id?: number;
  department_id?: string | number | bigint;
  sub_department_id?: string | number | bigint;
}

const toOptionalBigInt = (value: unknown): bigint | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return BigInt(Math.trunc(value));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (!/^[-]?\d+$/.test(trimmed)) {
      throw new BadRequestException(`Invalid bigint value: ${value}`);
    }
    return BigInt(trimmed);
  }

  return undefined;
};

@Controller('projects')
@SkipResourceCheck()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req: Record<string, unknown>) {
    // If tenant_id is not provided, try to get it from the request
    // For now, default to tenant_id: 1 if not provided (assumes single tenant or admin context)
    const tenantId = createProjectDto.tenant_id || (req.tenant_id as number) || 1;

    if (!tenantId) {
      throw new BadRequestException('tenant_id is required');
    }

    const submitData: TenantProjectCreateData = {
      name: createProjectDto.name,
      code: createProjectDto.code,
      tenant_id: tenantId,
      is_active: createProjectDto.is_active ?? true,
    };

    if (createProjectDto.description) {
      submitData.description = createProjectDto.description;
    }
    if (createProjectDto.start_date) {
      submitData.start_date = new Date(createProjectDto.start_date);
    }
    if (createProjectDto.end_date) {
      submitData.end_date = new Date(createProjectDto.end_date);
    }
    const departmentId = toOptionalBigInt(createProjectDto.department_id);
    if (departmentId !== undefined) {
      submitData.department_id = departmentId;
    }

    const subDepartmentId = toOptionalBigInt(createProjectDto.sub_department_id);
    if (subDepartmentId !== undefined) {
      submitData.sub_department_id = subDepartmentId;
    }

    return this.projectService.create(submitData);
  }

  @Get()
  findAll(@Query('tenant_id') tenantId?: string) {
    const filters = tenantId ? { tenant_id: parseInt(tenantId, 10) } : undefined;
    return this.projectService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: TenantProjectUpdateData & {
      department_id?: string | number | bigint;
      sub_department_id?: string | number | bigint;
    },
  ) {
    const { department_id, sub_department_id, ...rest } = updateProjectDto;
    const submitData: TenantProjectUpdateData = { ...rest };

    const departmentId = toOptionalBigInt(department_id);
    if (departmentId !== undefined) {
      submitData.department_id = departmentId;
    }

    const subDepartmentId = toOptionalBigInt(sub_department_id);
    if (subDepartmentId !== undefined) {
      submitData.sub_department_id = subDepartmentId;
    }

    return this.projectService.update(id, submitData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.remove(id);
  }
}
