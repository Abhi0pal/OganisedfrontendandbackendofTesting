
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FormFieldService } from './form-field.service';
import { CreateFormFieldDto, UpdateFormFieldDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';

@Controller('master/form-fields')
export class FormFieldController {
  constructor(private service: FormFieldService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Body() data: CreateFormFieldDto) {
    return this.service.create(data);
  }

  @Public()
  @Get()
  findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('parentId') parentId?: string
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    if (parentId !== undefined) filters.parentId = parseInt(parentId);
    return this.service.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @UseGuards(JwtGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateFormFieldDto) {
    return this.service.update(parseInt(id), data);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(parseInt(id));
  }

  @UseGuards(JwtGuard)
  @Put(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.service.toggle(parseInt(id));
  }
}
