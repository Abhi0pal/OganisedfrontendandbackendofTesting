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
import { MsmeYearService } from './msme-year.service';
import { CreateMsmeYearDto, UpdateMsmeYearDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/msme-year')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class MsmeYearController {
  constructor(private msmeYearService: MsmeYearService) {}

  @Post()
  async create(@Body() data: CreateMsmeYearDto) {
    return this.msmeYearService.create(data);
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

    return this.msmeYearService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.msmeYearService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateMsmeYearDto) {
    return this.msmeYearService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.msmeYearService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.msmeYearService.toggle(parseInt(id));
  }
}
