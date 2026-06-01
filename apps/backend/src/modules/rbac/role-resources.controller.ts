import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { RoleResourcesService } from './role-resources.service';
import { Prisma } from '@prisma/client';
import { Resource } from '../../common/resource.decorator';

@Controller('role-resources')
@Resource('MASTER_ROLE_RESOURCES')
export class RoleResourcesController {
    constructor(private readonly roleResourcesService: RoleResourcesService) { }

    @Post()
    create(@Body() createDto: { roleId: number; resourceId: string }) {
        // Custom DTO handling to map to Prisma input
        return this.roleResourcesService.create({
            role: { connect: { id: createDto.roleId } },
            resource: { connect: { id: BigInt(createDto.resourceId) } },
        });
    }

    @Get('role/:roleId')
    findByRoleId(@Param('roleId', ParseIntPipe) roleId: number) {
        return this.roleResourcesService.findByRoleId(roleId);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.roleResourcesService.remove(BigInt(id));
    }

    @Delete('role/:roleId/resource/:resourceId')
    removeByRoleAndResource(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Param('resourceId') resourceId: string
    ) {
        return this.roleResourcesService.removeByRoleAndResource(roleId, BigInt(resourceId));
    }
}
