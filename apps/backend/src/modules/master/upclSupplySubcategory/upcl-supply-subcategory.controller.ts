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
import { UpclSupplySubcategoryService } from './upcl-supply-subcategory.service';
import { CreateUpclSupplySubcategoryDto, UpdateUpclSupplySubcategoryDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/upcl-supply-subcategories')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class UpclSupplySubcategoryController {
  constructor(private upclSupplySubcategoryService: UpclSupplySubcategoryService) {}

  @Post()
  async create(@Body() data: CreateUpclSupplySubcategoryDto) {
    return this.upclSupplySubcategoryService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('supplyCategoryId') supplyCategoryId?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    if (type) {
      filters.type = type;
    }

    if (supplyCategoryId) {
      filters.supplyCategoryId = supplyCategoryId;
    }

    return this.upclSupplySubcategoryService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.upclSupplySubcategoryService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUpclSupplySubcategoryDto) {
    return this.upclSupplySubcategoryService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.upclSupplySubcategoryService.delete(id);
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.upclSupplySubcategoryService.toggle(id);
  }
}
