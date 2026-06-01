import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PollutionCategoriesService } from './pollution-categories.service';
import { CreatePollutionCategoryDto, UpdatePollutionCategoryDto } from './dto';
import { Public } from '../../../common/public.decorator';

@Public()
@Controller('master/pollution-categories')
export class PollutionCategoriesController {
  constructor(private pollutionCategoriesService: PollutionCategoriesService) {}

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    return this.pollutionCategoriesService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pollutionCategoriesService.findOne(parseInt(id));
  }

  @Post()
  create(@Body() data: CreatePollutionCategoryDto) {
    return this.pollutionCategoriesService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdatePollutionCategoryDto) {
    return this.pollutionCategoriesService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.pollutionCategoriesService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.pollutionCategoriesService.toggle(parseInt(id));
  }
}
