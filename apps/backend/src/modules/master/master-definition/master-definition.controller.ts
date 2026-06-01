import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  Query, Request,
} from '@nestjs/common';
import { MasterDefinitionService } from './master-definition.service';
import { CreateMasterDefinitionDto, UpdateMasterDefinitionDto } from './dto/master-definition.dto';

@Controller('master/definitions')
export class MasterDefinitionController {
  constructor(private readonly service: MasterDefinitionService) {}

  @Post()
  create(@Body() dto: CreateMasterDefinitionDto, @Request() req: any) {
    const userId = req.user?.id ? BigInt(req.user.id) : undefined;
    return this.service.create(dto, userId);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('is_active') isActive?: string,
    @Query('tenant_id') tenantId?: string,
    @Query('project_id') projectId?: string,
    @Query('department_id') departmentId?: string,
    @Query('sub_department_id') subDepartmentId?: string,
  ) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.service.findAll(search, active, {
      tenantId: tenantId ? Number(tenantId) : undefined,
      projectId: projectId ? Number(projectId) : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      subDepartmentId: subDepartmentId ? Number(subDepartmentId) : undefined,
    });
  }

  @Get('by-code/:code')
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMasterDefinitionDto, @Request() req: any) {
    const userId = req.user?.id ? BigInt(req.user.id) : undefined;
    return this.service.update(id, dto, userId);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
