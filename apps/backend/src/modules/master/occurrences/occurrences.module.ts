import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { OccurrencesService } from './occurrences.service';
import { OccurrencesController } from './occurrences.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OccurrencesController],
  providers: [OccurrencesService],
  exports: [OccurrencesService],
})
export class OccurrencesModule {}
