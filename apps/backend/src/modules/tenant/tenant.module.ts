import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ModuleService } from './module.service';
import { ModuleController } from './module.controller';
import { PrismaModule } from '../database/prisma.module';
import { PermissionModule } from '../user-management/permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [TenantsController, ProjectController, ModuleController],
  providers: [TenantsService, ProjectService, ModuleService],
  exports: [TenantsService, ProjectService, ModuleService, PermissionModule],
})
export class TenantModule {}
