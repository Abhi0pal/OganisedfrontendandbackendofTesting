import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaClient } from '@prisma/client';
import { Resource } from '../../common/resource.decorator';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';

// Version-proof types derived from client methods
type TenantCreateData = Parameters<PrismaClient['tenant']['create']>[0] extends { data: infer D } ? D : never;
type TenantUpdateData = Parameters<PrismaClient['tenant']['update']>[0] extends { data: infer D } ? D : never;

@Controller('tenants')
@Resource('TENANT_MANAGE')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @SkipResourceCheck()
  create(@Body() createTenantDto: TenantCreateData) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @SkipResourceCheck()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @SkipResourceCheck()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @SkipResourceCheck()
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTenantDto: TenantUpdateData) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @SkipResourceCheck()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.remove(id);
  }

  @Get(':id/themes')
  @SkipResourceCheck()
  getThemes(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.getThemes(id);
  }
}
