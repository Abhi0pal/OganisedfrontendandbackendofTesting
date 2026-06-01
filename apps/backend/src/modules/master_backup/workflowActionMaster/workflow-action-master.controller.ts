import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Public } from '../../../common/public.decorator';
import { WorkflowActionMasterService } from './workflow-action-master.service';
import { CreateWorkflowActionMasterDto, UpdateWorkflowActionMasterDto } from './dto';

@Public()
@Controller('master/workflow-actions')
export class WorkflowActionMasterController {
  constructor(private readonly workflowActionMasterService: WorkflowActionMasterService) {}

  @Get()
  async findAll(@Query('isActive') isActive?: string, @Query('search') search?: string) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    return this.workflowActionMasterService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workflowActionMasterService.findOne(parseInt(id, 10));
  }

  @Post()
  async create(@Body() data: CreateWorkflowActionMasterDto) {
    return this.workflowActionMasterService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateWorkflowActionMasterDto) {
    return this.workflowActionMasterService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.workflowActionMasterService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.workflowActionMasterService.toggle(parseInt(id, 10));
  }
}

