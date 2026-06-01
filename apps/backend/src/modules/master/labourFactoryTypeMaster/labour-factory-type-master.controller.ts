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
import { LabourFactoryTypeMasterService } from './labour-factory-type-master.service';
import { CreateLabourFactoryTypeMasterDto, UpdateLabourFactoryTypeMasterDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/labour-factory-type-master')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class LabourFactoryTypeMasterController {
  constructor(private labourFactoryTypeMasterService: LabourFactoryTypeMasterService) {}

  @Post()
  async create(@Body() data: CreateLabourFactoryTypeMasterDto) {
    return this.labourFactoryTypeMasterService.create(data);
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

    return this.labourFactoryTypeMasterService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.labourFactoryTypeMasterService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateLabourFactoryTypeMasterDto) {
    return this.labourFactoryTypeMasterService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.labourFactoryTypeMasterService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.labourFactoryTypeMasterService.toggle(parseInt(id, 10));
  }
}
