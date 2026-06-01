import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UnitOrganisationService } from './unit-organisation.service';
import { UnitOrganisationController } from './unit-organisation.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UnitOrganisationController],
  providers: [UnitOrganisationService],
  exports: [UnitOrganisationService],
})
export class UnitOrganisationModule {}
