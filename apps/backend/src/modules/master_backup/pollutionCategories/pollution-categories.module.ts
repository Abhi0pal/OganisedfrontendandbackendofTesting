import { Module } from '@nestjs/common';
import { PollutionCategoriesController } from './pollution-categories.controller';
import { PollutionCategoriesService } from './pollution-categories.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PollutionCategoriesController],
  providers: [PollutionCategoriesService, PrismaService],
})
export class PollutionCategoriesModule {}
