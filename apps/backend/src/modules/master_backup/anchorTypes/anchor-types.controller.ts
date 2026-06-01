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
import { AnchorTypesService } from './anchor-types.service';
import { CreateAnchorTypesDto, UpdateAnchorTypesDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/anchor-types')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class AnchorTypesController {
  constructor(private anchorTypesService: AnchorTypesService) {}

  @Post()
  async create(@Body() data: CreateAnchorTypesDto) {
    return this.anchorTypesService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    return this.anchorTypesService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.anchorTypesService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateAnchorTypesDto,
  ) {
    return this.anchorTypesService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.anchorTypesService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.anchorTypesService.toggle(parseInt(id));
  }
}
