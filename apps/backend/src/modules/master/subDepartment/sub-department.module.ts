import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SubDepartmentController } from './sub-department.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SubDepartmentController],
  providers: [],
})
export class SubDepartmentModule {}
