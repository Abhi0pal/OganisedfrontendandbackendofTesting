import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BlockController],
  providers: [BlockService],
  exports: [BlockService],
})
export class BlockModule {}
