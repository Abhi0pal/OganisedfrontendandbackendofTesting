import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CurrentLanduseController } from './current-landuse.controller';
import { CurrentLanduseService } from './current-landuse.service';

@Module({
  imports: [PrismaModule],
  controllers: [CurrentLanduseController],
  providers: [CurrentLanduseService],
  exports: [CurrentLanduseService],
})
export class CurrentLanduseModule {}
