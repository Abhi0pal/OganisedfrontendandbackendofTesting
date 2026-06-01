import { Module } from '@nestjs/common';
import { FbDashboardController } from './fb-dashboard.controller';
import { FbDashboardService } from './fb-dashboard.service';
import { WorkflowBuilderModule } from '../workflow-builder/workflow-builder.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [WorkflowBuilderModule, PrismaModule],
  controllers: [FbDashboardController],
  providers: [FbDashboardService],
})
export class FbDashboardModule {}
