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
import { HsnCodeService } from './hsn-code.service';
import { CreateHsnCodeDto, UpdateHsnCodeDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/hsn-codes')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class HsnCodeController {
  constructor(private hsnCodeService: HsnCodeService) {}

  @Post()
  async create(@Body() data: CreateHsnCodeDto) {
    return this.hsnCodeService.create(data);
  }

  @Public()
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive;
    }

    if (search) {
      filters.search = search;
    }

    return this.hsnCodeService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.hsnCodeService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateHsnCodeDto) {
    return this.hsnCodeService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.hsnCodeService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.hsnCodeService.toggle(parseInt(id));
  }
}
