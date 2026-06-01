import { Module } from '@nestjs/common';
import { RolePermissionController } from './role-permission.controller';
import { RolePermissionService } from './role-permission.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
   imports: [PrismaModule],
   controllers: [RolePermissionController],
   providers: [RolePermissionService],
   exports: [RolePermissionService],
})
export class RolePermissionModule {}

