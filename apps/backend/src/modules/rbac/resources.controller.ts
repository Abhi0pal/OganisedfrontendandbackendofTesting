
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { PrismaClient } from '@prisma/client';
import { Resource } from '../../common/resource.decorator';

// Version-proof types derived from client methods
type ResourcesCreateData = Parameters<PrismaClient['resources']['create']>[0] extends { data: infer D } ? D : never;
type ResourcesUpdateData = Parameters<PrismaClient['resources']['update']>[0] extends { data: infer D } ? D : never;

@Controller('resources')
@Resource('MASTER_RESOURCES')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  create(@Body() createResourceDto: ResourcesCreateData) {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(BigInt(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResourceDto: ResourcesUpdateData) {
    return this.resourcesService.update(BigInt(id), updateResourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resourcesService.remove(BigInt(id));
  }
}
