import { Module } from '@nestjs/common';
import { WorkflowConfigController } from './workflow-config.controller';
import { WorkflowConfigService } from './workflow-config.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [WorkflowConfigController],
  providers: [WorkflowConfigService, PrismaService],
})
export class WorkflowConfigModule {}
