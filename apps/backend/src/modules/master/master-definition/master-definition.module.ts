import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { MasterDefinitionController } from './master-definition.controller';
import { MasterDefinitionService } from './master-definition.service';

@Module({
  imports: [PrismaModule],
  controllers: [MasterDefinitionController],
  providers: [MasterDefinitionService],
  exports: [MasterDefinitionService],
})
export class MasterDefinitionModule {}
