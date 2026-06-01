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
import { DistrictService } from './district.service';
import { CreateDistrictDto, UpdateDistrictDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/districts')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class DistrictController {
  constructor(private districtService: DistrictService) { }

  @Post()
  async create(@Body() data: CreateDistrictDto) {
    return this.districtService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('stateId') stateId?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    if (stateId) {
      filters.stateId = parseInt(stateId);
    }

    return this.districtService.findAll(filters);
  }

  @Public()
  @Get('state/:stateId')
  async findByState(@Param('stateId') stateId: string) {
    return this.districtService.findByState(parseInt(stateId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.districtService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateDistrictDto) {
    return this.districtService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.districtService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.districtService.toggle(parseInt(id));
  }
}
