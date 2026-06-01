import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { StateService } from './state.service';
import { StateController } from './state.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StateController],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
