import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ServicetypeController } from './servicetype.controller';
import { ServicetypeService } from './servicetype.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServicetypeController],
  providers: [ServicetypeService],
  exports: [ServicetypeService]
})
export class ServicetypeModule {}
