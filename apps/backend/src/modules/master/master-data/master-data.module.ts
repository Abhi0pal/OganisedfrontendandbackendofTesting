import { Module } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { MasterDataController } from './master-data.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
