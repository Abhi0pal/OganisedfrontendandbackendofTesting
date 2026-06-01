import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { UserManagementScopeService } from './user-management-scope.service';
import { UserManagementScopeController } from './user-management-scope.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserManagementScopeController],
  providers: [UserManagementScopeService],
  exports: [UserManagementScopeService],
})
export class UserManagementScopeModule {}