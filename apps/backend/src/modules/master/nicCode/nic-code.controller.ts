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
import { NicCodeService } from './nic-code.service';
import { CreateNicCodeDto, UpdateNicCodeDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/nic-codes')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class NicCodeController {
  constructor(private nicCodeService: NicCodeService) {}

  @Post()
  async create(@Body() data: CreateNicCodeDto) {
    return this.nicCodeService.create(data);
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

    return this.nicCodeService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.nicCodeService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateNicCodeDto) {
    return this.nicCodeService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.nicCodeService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.nicCodeService.toggle(parseInt(id));
  }
}
