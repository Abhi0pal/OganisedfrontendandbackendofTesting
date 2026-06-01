import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { WorkflowAssignmentStrategyController } from './workflow-assignment-strategy.controller';
import { WorkflowAssignmentStrategyService } from './workflow-assignment-strategy.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkflowAssignmentStrategyController],
  providers: [WorkflowAssignmentStrategyService],
  exports: [WorkflowAssignmentStrategyService],
})
export class WorkflowAssignmentStrategyModule {}

