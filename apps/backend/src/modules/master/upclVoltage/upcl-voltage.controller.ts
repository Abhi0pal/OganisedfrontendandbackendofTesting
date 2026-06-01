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
import { UpclVoltageService } from './upcl-voltage.service';
import { CreateUpclVoltageDto, UpdateUpclVoltageDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/upcl-voltage')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class UpclVoltageController {
  constructor(private upclVoltageService: UpclVoltageService) {}

  @Post()
  async create(@Body() data: CreateUpclVoltageDto) {
    return this.upclVoltageService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('voltageGroup') voltageGroup?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    if (voltageGroup) {
      filters.voltageGroup = voltageGroup;
    }

    return this.upclVoltageService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.upclVoltageService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUpclVoltageDto) {
    return this.upclVoltageService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.upclVoltageService.delete(id);
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.upclVoltageService.toggle(id);
  }
}
