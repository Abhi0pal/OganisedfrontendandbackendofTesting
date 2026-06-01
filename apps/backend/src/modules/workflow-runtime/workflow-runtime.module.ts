import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  WorkflowRuntimeController,
  WorkflowTasksController,
} from './workflow-runtime.controller';
import { WorkflowRuntimeService } from './workflow-runtime.service';

@Module({
  controllers: [WorkflowRuntimeController, WorkflowTasksController],
  providers: [WorkflowRuntimeService, PrismaService],
  exports: [WorkflowRuntimeService],
})
export class WorkflowRuntimeModule {}
