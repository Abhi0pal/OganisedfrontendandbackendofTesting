import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { WorkflowFieldsService } from './workflow-fields.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';

@SkipResourceCheck()
@Controller('workflow-builder/fields')
@UseGuards(JwtGuard)
export class WorkflowFieldsController {
  constructor(private readonly service: WorkflowFieldsService) {}

  @SkipResourceCheck()
  @Get('master')
  async getMasterFields() {
    return this.service.getMasterFields();
  }

  @SkipResourceCheck()
  @Post('add-to-step')
  async addFieldToStep(
    @Body() body: { 
      serviceId: string; 
      formTypeId: number; 
      fieldId: number; 
      workflowStepId: number; 
      categoryId?: number 
    },
  ) {
    return this.service.addFieldToStep(body);
  }

  @SkipResourceCheck()
  @Post('remove/:id')
  async removeField(@Param('id') id: string) {
    return this.service.removeField(Number(id));
  }
}
