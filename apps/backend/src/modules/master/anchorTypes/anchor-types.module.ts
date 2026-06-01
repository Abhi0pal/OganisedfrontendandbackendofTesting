import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AnchorTypesService } from './anchor-types.service';
import { AnchorTypesController } from './anchor-types.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnchorTypesController],
  providers: [AnchorTypesService],
  exports: [AnchorTypesService],
})
export class AnchorTypesModule {}
