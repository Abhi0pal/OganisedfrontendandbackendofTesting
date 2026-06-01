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
import { BeneficiaryTypesService } from './beneficiary-types.service';
import { CreateBeneficiaryTypesDto, UpdateBeneficiaryTypesDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/beneficiary-types')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class BeneficiaryTypesController {
  constructor(private service: BeneficiaryTypesService) {}

  @Post()
  async create(@Body() data: CreateBeneficiaryTypesDto) {
    return this.service.create(data);
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
    return this.service.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateBeneficiaryTypesDto) {
    return this.service.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.service.toggle(parseInt(id));
  }
}
