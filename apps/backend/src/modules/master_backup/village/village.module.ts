import { Module } from '@nestjs/common';
import { VillageService } from './village.service';
import { VillageController } from './village.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VillageController],
  providers: [VillageService],
  exports: [VillageService],
})
export class VillageModule {}
