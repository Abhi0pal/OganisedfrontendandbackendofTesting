import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, Query } from '@nestjs/common';
import {
  IncentiveApplicationSubmissionService,
} from './incentive-application-submission.service';
import {
  CreateIncentiveApplicationSubmissionDto,
  UpdateIncentiveApplicationSubmissionDto,
} from './dto';
import { Public } from '../../../common/public.decorator';
import { ApplicationStatus } from '@prisma/client';


@Controller('incentive-application-submission')
export class IncentiveApplicationSubmissionController {
  constructor(private readonly service: IncentiveApplicationSubmissionService) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateIncentiveApplicationSubmissionDto) {
    return this.service.create(dto);
  }

  // @Public()
  // @Get()
  // async findAll() {
  //   return this.service.findAll();
  // }

  @Public()
  @Get()
  findAll(
    @Query('incentiveId') incentiveId?: string,
    @Query('applicationStatus') applicationStatus?: ApplicationStatus,
    @Query('userId') userId?: string,
  ) {
    return this.service.findFiltered({
      incentiveId: incentiveId ? Number(incentiveId) : undefined,
      applicationStatus,
      userId: userId ? Number(userId) : undefined,
    });
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
    @Body() dto: UpdateIncentiveApplicationSubmissionDto
  ) {
    return this.service.update(id, dto);
  }

  @Public()
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
