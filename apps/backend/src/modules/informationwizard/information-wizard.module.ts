import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { InformationWizardController } from './information-wizard.controller';
import { InformationWizardService } from './information-wizard.service';

@Module({
  imports: [PrismaModule],
  controllers: [InformationWizardController],
  providers: [InformationWizardService],
  exports: [InformationWizardService],
})
export class InformationWizardModule {}
