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
import { KyiIcCalculatorService } from './kyi-ic-calculator.service';
import { CreateKyiIcCalculatorDto, UpdateKyiIcCalculatorDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/kyi-ic-calculator')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class KyiIcCalculatorController {
  constructor(private kyiIcCalculatorService: KyiIcCalculatorService) {}

  @Post()
  async create(@Body() data: CreateKyiIcCalculatorDto) {
    return this.kyiIcCalculatorService.create(data);
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

    return this.kyiIcCalculatorService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.kyiIcCalculatorService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateKyiIcCalculatorDto,
  ) {
    return this.kyiIcCalculatorService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.kyiIcCalculatorService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.kyiIcCalculatorService.toggle(parseInt(id));
  }
}
