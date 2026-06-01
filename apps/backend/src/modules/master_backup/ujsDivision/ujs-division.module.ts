import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UjsDivisionController } from './ujs-division.controller';
import { UjsDivisionService } from './ujs-division.service';

@Module({
  imports: [PrismaModule],
  controllers: [UjsDivisionController],
  providers: [UjsDivisionService],
  exports: [UjsDivisionService],
})
export class UjsDivisionModule {}
