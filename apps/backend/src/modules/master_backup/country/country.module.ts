import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CountryService } from './country.service';
import { CountryController } from './country.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CountryController],
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
