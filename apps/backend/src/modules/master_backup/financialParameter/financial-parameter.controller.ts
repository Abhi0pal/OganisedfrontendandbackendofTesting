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
import { FinancialParameterService } from './financial-parameter.service';
import {
  CreateFinancialParameterDto,
  UpdateFinancialParameterDto,
} from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/financial-parameters')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class FinancialParameterController {
  constructor(private financialParameterService: FinancialParameterService) {}

  @Post()
  async create(@Body() data: CreateFinancialParameterDto) {
    return this.financialParameterService.create(data);
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

    return this.financialParameterService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.financialParameterService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateFinancialParameterDto,
  ) {
    return this.financialParameterService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.financialParameterService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.financialParameterService.toggle(parseInt(id));
  }
}
