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
import { LabourFactorySec85Service } from './labour-factory-sec85.service';
import { CreateLabourFactorySec85Dto, UpdateLabourFactorySec85Dto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/labour-factory-sec85')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class LabourFactorySec85Controller {
  constructor(private labourFactorySec85Service: LabourFactorySec85Service) {}

  @Post()
  async create(@Body() data: CreateLabourFactorySec85Dto) {
    return this.labourFactorySec85Service.create(data);
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

    return this.labourFactorySec85Service.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.labourFactorySec85Service.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateLabourFactorySec85Dto) {
    return this.labourFactorySec85Service.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.labourFactorySec85Service.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.labourFactorySec85Service.toggle(parseInt(id, 10));
  }
}
