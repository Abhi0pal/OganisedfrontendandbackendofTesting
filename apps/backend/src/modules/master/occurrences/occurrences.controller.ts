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
import { OccurrencesService } from './occurrences.service';
import { CreateOccurrencesDto, UpdateOccurrencesDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/occurrences')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class OccurrencesController {
  constructor(private occurrencesService: OccurrencesService) {}

  @Post()
  async create(@Body() data: CreateOccurrencesDto) {
    return this.occurrencesService.create(data);
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

    return this.occurrencesService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.occurrencesService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateOccurrencesDto) {
    return this.occurrencesService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.occurrencesService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.occurrencesService.toggle(parseInt(id));
  }
}
