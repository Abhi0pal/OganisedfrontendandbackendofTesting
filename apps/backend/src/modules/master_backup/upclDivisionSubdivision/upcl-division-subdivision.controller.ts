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
  ParseIntPipe,
} from '@nestjs/common';
import { UpclDivisionSubdivisionService } from './upcl-division-subdivision.service';
import {
  CreateUpclDivisionSubdivisionDto,
  UpdateUpclDivisionSubdivisionDto,
} from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/upcl-division-subdivisions')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class UpclDivisionSubdivisionController {
  constructor(private upclDivisionSubdivisionService: UpclDivisionSubdivisionService) {}

  @Post()
  async create(@Body() data: CreateUpclDivisionSubdivisionDto) {
    return this.upclDivisionSubdivisionService.create(data);
  }

  @Public()
  @Get()
  async findAll(@Query('isActive') isActive?: string, @Query('search') search?: string) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    return this.upclDivisionSubdivisionService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.upclDivisionSubdivisionService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUpclDivisionSubdivisionDto) {
    return this.upclDivisionSubdivisionService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.upclDivisionSubdivisionService.delete(id);
  }

  @Put(':id/toggle')
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return this.upclDivisionSubdivisionService.toggle(id);
  }
}
