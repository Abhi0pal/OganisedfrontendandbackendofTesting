import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UpclDivisionSubdivisionController } from './upcl-division-subdivision.controller';
import { UpclDivisionSubdivisionService } from './upcl-division-subdivision.service';

@Module({
  imports: [PrismaModule],
  controllers: [UpclDivisionSubdivisionController],
  providers: [UpclDivisionSubdivisionService],
  exports: [UpclDivisionSubdivisionService],
})
export class UpclDivisionSubdivisionModule {}
