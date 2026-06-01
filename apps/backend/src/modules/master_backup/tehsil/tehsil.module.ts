import { Module } from '@nestjs/common';
import { TehsilService } from './tehsil.service';
import { TehsilController } from './tehsil.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TehsilController],
  providers: [TehsilService],
  exports: [TehsilService],
})
export class TehsilModule {}
