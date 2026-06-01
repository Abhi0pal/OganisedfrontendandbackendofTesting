import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Public } from '../../../common/public.decorator';
import { WorkflowAssignmentStrategyService } from './workflow-assignment-strategy.service';
import {
  CreateWorkflowAssignmentStrategyDto,
  UpdateWorkflowAssignmentStrategyDto,
} from './dto';

@Public()
@Controller('master/workflow-assignment-strategies')
export class WorkflowAssignmentStrategyController {
  constructor(private readonly workflowAssignmentStrategyService: WorkflowAssignmentStrategyService) {}

  @Get()
  async findAll(@Query('isActive') isActive?: string, @Query('search') search?: string) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    return this.workflowAssignmentStrategyService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workflowAssignmentStrategyService.findOne(parseInt(id, 10));
  }

  @Post()
  async create(@Body() data: CreateWorkflowAssignmentStrategyDto) {
    return this.workflowAssignmentStrategyService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateWorkflowAssignmentStrategyDto) {
    return this.workflowAssignmentStrategyService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.workflowAssignmentStrategyService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.workflowAssignmentStrategyService.toggle(parseInt(id, 10));
  }
}

