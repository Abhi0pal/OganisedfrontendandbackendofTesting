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
import { LandCategoriesService } from './land-categories.service';
import { CreateLandCategoriesDto, UpdateLandCategoriesDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/land-categories')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class LandCategoriesController {
  constructor(private landCategoriesService: LandCategoriesService) {}

  @Post()
  async create(@Body() data: CreateLandCategoriesDto) {
    return this.landCategoriesService.create(data);
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

    return this.landCategoriesService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.landCategoriesService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateLandCategoriesDto,
  ) {
    return this.landCategoriesService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.landCategoriesService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.landCategoriesService.toggle(parseInt(id));
  }
}
