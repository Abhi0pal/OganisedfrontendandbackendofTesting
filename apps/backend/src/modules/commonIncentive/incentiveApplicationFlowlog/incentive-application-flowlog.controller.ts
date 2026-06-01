import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import {
  IncentiveApplicationFlowlogService,
} from './incentive-application-flowlog.service';
import {
  CreateIncentiveApplicationFlowlogDto,
  UpdateIncentiveApplicationFlowlogDto,
} from './dto';
import { Public } from '../../../common/public.decorator';

@Controller('incentive-application-flowlog')
export class IncentiveApplicationFlowlogController {
  constructor(private readonly service: IncentiveApplicationFlowlogService) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateIncentiveApplicationFlowlogDto) {
    return this.service.create(dto);
  }

  @Public()
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Public()
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncentiveApplicationFlowlogDto
  ) {
    return this.service.update(id, dto);
  }

  @Public()
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
