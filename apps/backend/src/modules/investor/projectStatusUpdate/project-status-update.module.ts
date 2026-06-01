import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ProjectStatusUpdateController } from './project-status-update.controller';
import { ProjectStatusUpdateService } from './project-status-update.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectStatusUpdateController],
  providers: [ProjectStatusUpdateService],
})
export class ProjectStatusUpdateModule {}
