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
import { PollutionControlEquipmentService } from './pollution-control-equipment.service';
import { CreatePollutionControlEquipmentDto, UpdatePollutionControlEquipmentDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/pollution-control-equipments')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class PollutionControlEquipmentController {
  constructor(private pollutionControlEquipmentService: PollutionControlEquipmentService) {}

  @Post()
  async create(@Body() data: CreatePollutionControlEquipmentDto) {
    return this.pollutionControlEquipmentService.create(data);
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

    return this.pollutionControlEquipmentService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pollutionControlEquipmentService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdatePollutionControlEquipmentDto) {
    return this.pollutionControlEquipmentService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.pollutionControlEquipmentService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.pollutionControlEquipmentService.toggle(parseInt(id, 10));
  }
}
