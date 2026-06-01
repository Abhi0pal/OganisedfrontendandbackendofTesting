import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { WorkflowActionMasterController } from './workflow-action-master.controller';
import { WorkflowActionMasterService } from './workflow-action-master.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkflowActionMasterController],
  providers: [WorkflowActionMasterService],
  exports: [WorkflowActionMasterService],
})
export class WorkflowActionMasterModule {}

