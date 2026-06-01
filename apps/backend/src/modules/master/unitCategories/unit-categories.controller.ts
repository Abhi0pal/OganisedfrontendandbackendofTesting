import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UnitCategoriesService } from './unit-categories.service';
import { CreateUnitCategoriesDto, UpdateUnitCategoriesDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/unit-categories')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class UnitCategoriesController {
  constructor(private unitCategoriesService: UnitCategoriesService) {}

  @Post()
  async create(@Body() data: CreateUnitCategoriesDto) {
    return this.unitCategoriesService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    return this.unitCategoriesService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.unitCategoriesService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUnitCategoriesDto) {
    return this.unitCategoriesService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.unitCategoriesService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.unitCategoriesService.toggle(parseInt(id));
  }
}
