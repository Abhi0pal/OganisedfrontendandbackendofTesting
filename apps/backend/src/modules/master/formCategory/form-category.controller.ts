
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { FormCategoryService } from './form-category.service';
import { CreateFormCategoryDto } from './dto/create-form-category.dto';
import { UpdateFormCategoryDto } from './dto/update-form-category.dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';

@Controller('master/form-categories')
export class FormCategoryController {
  constructor(private service: FormCategoryService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Body() dto: CreateFormCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('parentId') parentId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('projectId') projectId?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    if (parentId !== undefined) filters.parentId = parseInt(parentId);
    if (tenantId) filters.tenantId = parseInt(tenantId);
    if (projectId) filters.projectId = parseInt(projectId);
    return this.service.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @UseGuards(JwtGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFormCategoryDto) {
    return this.service.update(+id, dto);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }

  @UseGuards(JwtGuard)
  @Put(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.service.toggle(+id);
  }
}
