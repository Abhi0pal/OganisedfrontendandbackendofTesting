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
import { CurrentLanduseService } from './current-landuse.service';
import { CreateCurrentLanduseDto, UpdateCurrentLanduseDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/current-landuse')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class CurrentLanduseController {
  constructor(private currentLanduseService: CurrentLanduseService) {}

  @Post()
  async create(@Body() data: CreateCurrentLanduseDto) {
    return this.currentLanduseService.create(data);
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

    return this.currentLanduseService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.currentLanduseService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateCurrentLanduseDto) {
    return this.currentLanduseService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.currentLanduseService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.currentLanduseService.toggle(parseInt(id, 10));
  }
}
