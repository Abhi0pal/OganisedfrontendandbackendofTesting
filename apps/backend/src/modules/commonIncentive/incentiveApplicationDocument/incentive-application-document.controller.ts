import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { IncentiveApplicationDocumentService } from './incentive-application-document.service';
import { CreateIncentiveApplicationDocumentDto, UpdateIncentiveApplicationDocumentDto } from './dto';
import { Public } from '../../../common/public.decorator';

@Controller('incentive-application-document')
export class IncentiveApplicationDocumentController {
  constructor(private readonly service: IncentiveApplicationDocumentService) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateIncentiveApplicationDocumentDto) {
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
    @Body() dto: UpdateIncentiveApplicationDocumentDto
  ) {
    return this.service.update(id, dto);
  }

  @Public()
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
