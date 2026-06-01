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
import { UjsDivisionService } from './ujs-division.service';
import { CreateUjsDivisionDto, UpdateUjsDivisionDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/ujs-divisions')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class UjsDivisionController {
  constructor(private ujsDivisionService: UjsDivisionService) {}

  @Post()
  async create(@Body() data: CreateUjsDivisionDto) {
    return this.ujsDivisionService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    if (divisionId) {
      filters.divisionId = parseInt(divisionId, 10);
    }

    return this.ujsDivisionService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ujsDivisionService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUjsDivisionDto) {
    return this.ujsDivisionService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.ujsDivisionService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.ujsDivisionService.toggle(parseInt(id, 10));
  }
}
