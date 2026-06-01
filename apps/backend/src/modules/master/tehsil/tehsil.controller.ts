import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TehsilService } from './tehsil.service';
import { CreateTehsilDto, UpdateTehsilDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('tehsils')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class TehsilController {
  constructor(private readonly tehsilService: TehsilService) {}

  @Get()
  findAll(
    @Query('districtId') districtId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.tehsilService.findAll({
      districtId: districtId ? parseInt(districtId, 10) : undefined,
      isActive:
        isActive !== undefined ? String(isActive).toLowerCase() === 'true' : undefined,
      search: search?.trim() || undefined,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tehsilService.findOne(id);
  }

  @Post()
  create(@Body() createTehsilDto: CreateTehsilDto) {
    return this.tehsilService.create(createTehsilDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTehsilDto: UpdateTehsilDto,
  ) {
    return this.tehsilService.update(id, updateTehsilDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tehsilService.remove(id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.tehsilService.toggleStatus(id);
  }
}
