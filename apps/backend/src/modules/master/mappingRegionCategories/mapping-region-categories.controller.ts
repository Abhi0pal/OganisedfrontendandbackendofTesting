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
import { MappingRegionCategoriesService } from './mapping-region-categories.service';
import {
  CreateMappingRegionCategoriesDto,
  UpdateMappingRegionCategoriesDto,
} from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/mapping-region-categories')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class MappingRegionCategoriesController {
  constructor(
    private mappingRegionCategoriesService: MappingRegionCategoriesService,
  ) {}

  @Post()
  async create(@Body() data: CreateMappingRegionCategoriesDto) {
    return this.mappingRegionCategoriesService.create(data);
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

    return this.mappingRegionCategoriesService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.mappingRegionCategoriesService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateMappingRegionCategoriesDto,
  ) {
    return this.mappingRegionCategoriesService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.mappingRegionCategoriesService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.mappingRegionCategoriesService.toggle(parseInt(id));
  }

  // Controller
  @Put(':id/toggle-by-category')
  async toggleByCategory(@Param('id') id: string) {
    const categoryId = parseInt(id, 10);
    return this.mappingRegionCategoriesService.toggleByCategory(categoryId);
  }

}
