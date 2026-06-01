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
import { BlockService } from './block.service';
import { CreateBlockDto, UpdateBlockDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/blocks')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class BlockController {
  constructor(private blockService: BlockService) {}

  @Post()
  async create(@Body() data: CreateBlockDto) {
    return this.blockService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('districtId') districtId?: string,
    @Query('stateId') stateId?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (search) {
      filters.search = search;
    }
    if (districtId) {
      filters.districtId = parseInt(districtId);
    }
    if (stateId) {
      filters.stateId = parseInt(stateId);
    }

    return this.blockService.findAll(filters);
  }

  @Get('by-district/:districtId')
  async findByDistrict(@Param('districtId') districtId: string) {
    return this.blockService.findByDistrict(parseInt(districtId));
  }

  @Get('by-state/:stateId')
  async findByState(@Param('stateId') stateId: string) {
    return this.blockService.findByState(parseInt(stateId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.blockService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateBlockDto) {
    return this.blockService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.blockService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.blockService.toggle(parseInt(id));
  }
}
