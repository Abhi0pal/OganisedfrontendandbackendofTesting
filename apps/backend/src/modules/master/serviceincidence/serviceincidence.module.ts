import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ServiceincidenceController } from './serviceincidence.controller';
import { ServiceincidenceService } from './serviceincidence.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceincidenceController],
  providers: [ServiceincidenceService],
  exports: [ServiceincidenceService]
})
export class ServiceincidenceModule {}
