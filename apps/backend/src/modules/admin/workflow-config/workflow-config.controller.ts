import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkflowConfigService } from './workflow-config.service';
import { CreateWorkflowConfigDto, UpdateWorkflowConfigDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';

@Controller('admin/workflow-config')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class WorkflowConfigController {
  constructor(private readonly workflowConfigService: WorkflowConfigService) {}

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('processingLevel') processingLevel?: string,
    @Query('formTypeId') formTypeId?: string,
    @Query('configVersion') configVersion?: string,
    @Query('status') status?: string,
    @Query('jurisdictionLevelId') jurisdictionLevelId?: string,
    @Query('assignmentStrategyId') assignmentStrategyId?: string,
  ) {
    return this.workflowConfigService.findAll({
      serviceId,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      processingLevel,
      formTypeId: formTypeId ? parseInt(formTypeId) : undefined,
      configVersion: configVersion ? parseInt(configVersion) : undefined,
      status,
      jurisdictionLevelId: jurisdictionLevelId
        ? parseInt(jurisdictionLevelId)
        : undefined,
      assignmentStrategyId: assignmentStrategyId
        ? parseInt(assignmentStrategyId)
        : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workflowConfigService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateWorkflowConfigDto) {
    return this.workflowConfigService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateWorkflowConfigDto,
  ) {
    return this.workflowConfigService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.workflowConfigService.delete(id);
  }
}
