import { Module } from '@nestjs/common';
import { WorkflowBuilderController } from './workflow-builder.controller';
import { WorkflowEngineController } from './workflow-engine.controller';
import { WorkflowBuilderService } from './workflow-builder.service';
import { WorkflowBuilderEngineService } from './workflow-builder-engine.service';
import { WorkflowBuilderConditionService } from './workflow-builder-condition.service';
import { WorkflowPermissionsController } from './workflow-permissions.controller';
import { WorkflowPermissionsService } from './workflow-permissions.service';
import { WorkflowFieldsController } from './workflow-fields.controller';
import { WorkflowFieldsService } from './workflow-fields.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    WorkflowBuilderController, 
    WorkflowEngineController, 
    WorkflowPermissionsController,
    WorkflowFieldsController
  ],
  providers: [
    WorkflowBuilderService,
    WorkflowBuilderEngineService,
    WorkflowBuilderConditionService,
    WorkflowPermissionsService,
    WorkflowFieldsService,
  ],
  exports: [
    WorkflowBuilderService,
    WorkflowBuilderEngineService,
    WorkflowBuilderConditionService,
    WorkflowPermissionsService,
    WorkflowFieldsService,
  ],
})
export class WorkflowBuilderModule {}
