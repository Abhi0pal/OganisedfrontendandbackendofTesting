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
import { LandAllotmentStageService } from './land-allotment-stage.service';
import { CreateLandAllotmentStageDto, UpdateLandAllotmentStageDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/land-allotment-stage')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class LandAllotmentStageController {
  constructor(private landAllotmentStageService: LandAllotmentStageService) {}

  @Post()
  async create(@Body() data: CreateLandAllotmentStageDto) {
    return this.landAllotmentStageService.create(data);
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

    return this.landAllotmentStageService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.landAllotmentStageService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateLandAllotmentStageDto) {
    return this.landAllotmentStageService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.landAllotmentStageService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.landAllotmentStageService.toggle(parseInt(id, 10));
  }
}
