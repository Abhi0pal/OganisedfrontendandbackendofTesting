import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ProjectStatusController } from './project-status.controller';
import { ProjectStatusService } from './project-status.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectStatusController],
  providers: [ProjectStatusService],
  exports: [ProjectStatusService],
})
export class ProjectStatusModule {}
