import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Public } from '../../../common/public.decorator';
import { WorkflowJurisdictionLevelService } from './workflow-jurisdiction-level.service';
import {
  CreateWorkflowJurisdictionLevelDto,
  UpdateWorkflowJurisdictionLevelDto,
} from './dto';

@Public()
@Controller('master/workflow-jurisdiction-levels')
export class WorkflowJurisdictionLevelController {
  constructor(private readonly workflowJurisdictionLevelService: WorkflowJurisdictionLevelService) {}

  @Get()
  async findAll(@Query('isActive') isActive?: string, @Query('search') search?: string) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    return this.workflowJurisdictionLevelService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workflowJurisdictionLevelService.findOne(parseInt(id, 10));
  }

  @Post()
  async create(@Body() data: CreateWorkflowJurisdictionLevelDto) {
    return this.workflowJurisdictionLevelService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateWorkflowJurisdictionLevelDto) {
    return this.workflowJurisdictionLevelService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.workflowJurisdictionLevelService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.workflowJurisdictionLevelService.toggle(parseInt(id, 10));
  }
}

