import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService]
})
export class ServiceModule {}
