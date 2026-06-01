import { Module } from '@nestjs/common';
import { AdminController } from '../admin/admin.controller';
import { AdminService } from '../admin/admin.service';
import { PrismaService } from '../database/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
