import { Module } from '@nestjs/common';
// import { RolePermissionModule } from './role-permissions/role-permission.module';
import { RolePermissionModule } from './role-permission/role-permission.module'
import {RolesModule} from './roles/roles.module';
import { PermissionModule } from './permission/permission.module';
import { UserRoleAssignmentModule } from './userRoleAssignment/user-role-assignment.module';
import { UserManagementScopeModule } from '../user-management-scope/user-management-scope.module';

import { UserAssignmentPermissionOverrideModule } 
  from './user-assignment-permission-override/user-assignment-permission-override.module';
import { UserModule } from './user/user.module';


@Module({
  imports: [
    RolePermissionModule,
    RolesModule,
    PermissionModule,
    UserRoleAssignmentModule,
    UserManagementScopeModule,
    UserAssignmentPermissionOverrideModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})


export class UserManagementModule {}