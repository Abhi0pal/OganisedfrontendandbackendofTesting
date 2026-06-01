import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { WorkflowJurisdictionLevelController } from './workflow-jurisdiction-level.controller';
import { WorkflowJurisdictionLevelService } from './workflow-jurisdiction-level.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkflowJurisdictionLevelController],
  providers: [WorkflowJurisdictionLevelService],
  exports: [WorkflowJurisdictionLevelService],
})
export class WorkflowJurisdictionLevelModule {}

