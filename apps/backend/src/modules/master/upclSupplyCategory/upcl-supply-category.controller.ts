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
import { UpclSupplyCategoryService } from './upcl-supply-category.service';
import { CreateUpclSupplyCategoryDto, UpdateUpclSupplyCategoryDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/upcl-supply-categories')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class UpclSupplyCategoryController {
  constructor(private upclSupplyCategoryService: UpclSupplyCategoryService) {}

  @Post()
  async create(@Body() data: CreateUpclSupplyCategoryDto) {
    return this.upclSupplyCategoryService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
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

    return this.upclSupplyCategoryService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.upclSupplyCategoryService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUpclSupplyCategoryDto) {
    return this.upclSupplyCategoryService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.upclSupplyCategoryService.delete(id);
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.upclSupplyCategoryService.toggle(id);
  }
}
