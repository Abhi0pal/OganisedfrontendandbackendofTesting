import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { UserAssignmentPermissionOverrideController } from './user-assignment-permission-override.controller';
import { UserAssignmentPermissionOverrideService } from './user-assignment-permission-override.service';

@Module({
  controllers: [UserAssignmentPermissionOverrideController],
  providers: [UserAssignmentPermissionOverrideService, PrismaService],
})
export class UserAssignmentPermissionOverrideModule {}
