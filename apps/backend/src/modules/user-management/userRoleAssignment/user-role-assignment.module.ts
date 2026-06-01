import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UserRoleAssignmentService } from './user-role-assignment.service';
import { UserRoleAssignmentController } from './user-role-assignment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserRoleAssignmentController],
  providers: [UserRoleAssignmentService],
  exports: [UserRoleAssignmentService],
})
export class UserRoleAssignmentModule {}

