import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ServicesectorController } from './servicesector.controller';
import { ServicesectorService } from './servicesector.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesectorController],
  providers: [ServicesectorService],
  exports: [ServicesectorService]
})
export class ServicesectorModule {}
