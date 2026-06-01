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
import { UnitOrganisationService } from './unit-organisation.service';
import { CreateUnitOrganisationDto, UpdateUnitOrganisationDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/unit-organisation')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class UnitOrganisationController {
  constructor(private unitOrganisationService: UnitOrganisationService) {}

  @Post()
  async create(@Body() data: CreateUnitOrganisationDto) {
    return this.unitOrganisationService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    return this.unitOrganisationService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.unitOrganisationService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUnitOrganisationDto) {
    return this.unitOrganisationService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.unitOrganisationService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.unitOrganisationService.toggle(parseInt(id));
  }
}
