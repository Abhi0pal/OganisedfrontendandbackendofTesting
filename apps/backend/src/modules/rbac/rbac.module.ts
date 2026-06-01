import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { RoleResourcesService } from './role-resources.service';
import { RoleResourcesController } from './role-resources.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RolesController, ResourcesController, RoleResourcesController],
    providers: [RolesService, ResourcesService, RoleResourcesService],
    exports: [RolesService, ResourcesService, RoleResourcesService],
})
export class RbacModule { }
