import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Resource } from '../../common/resource.decorator';
import { AdminService } from '../admin/admin.service';
import { ResponseHelper } from '../../common/response.helper';
import { ScopeType } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Resource('MASTER_ALL')
  @Get('users')
  async getUsers() {
    const users = await this.adminService.getUsers();
    return ResponseHelper.success('Users fetched successfully', users);
  }

  @Resource('MASTER_ALL')
  @Post('users')
  async createUser(@Body() body: any) {
    const user = await this.adminService.createUser(body);
    return ResponseHelper.success('User created successfully', user);
  }

  @Resource('MASTER_ALL')
  @Put('users/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const user = await this.adminService.updateUser(id, body);
    return ResponseHelper.success('User updated successfully', user);
  }

  @Resource('MASTER_ALL')
  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteUser(id);
    return ResponseHelper.success('User deleted successfully', null);
  }

  @Resource('MASTER_ALL')
  @Get('roles')
  async getRoles() {
    const roles = await this.adminService.getRoles();
    return ResponseHelper.success('Roles fetched successfully', roles);
  }

  @Resource('MASTER_ALL')
  @Get('circle-options')
  async getCircleOptions(
    @Query('districtId') districtId?: string,
    @Query('blockId') blockId?: string,
    @Query('tehsilId') tehsilId?: string,
  ) {
    const circles = await this.adminService.getCircleOptions({
      districtId: districtId ? parseInt(districtId, 10) : undefined,
      blockId: blockId ? parseInt(blockId, 10) : undefined,
      tehsilId: tehsilId ? parseInt(tehsilId, 10) : undefined,
    });

    return ResponseHelper.success('Circle options fetched successfully', circles);
  }

  @Resource('MASTER_ALL')
  @Get('permissions')
  async getPermissions() {
    const permissions = await this.adminService.getPermissions();
    return ResponseHelper.success(
      'Permissions fetched successfully',
      permissions,
    );
  }

  @Resource('MASTER_ALL')
  @Get('user-management/assignment-scope-options')
  async getAssignmentScopeOptions(
    @Query('scopeType') scopeType: string,
    @Query('tenantId') tenantId?: string,
    @Query('projectId') projectId?: string,
    @Query('stateId') stateId?: string,
    @Query('districtId') districtId?: string,
    @Query('blockId') blockId?: string,
    @Query('tehsilId') tehsilId?: string,
  ) {
    const normalizedScopeType = (scopeType || '').trim().toUpperCase() as ScopeType;
    const validScopeTypes: ScopeType[] = [
      'STATE',
      'DISTRICT',
      'BLOCK',
      'TEHSIL',
      'CIRCLE',
      'DIVISION',
      'VILLAGE',
      'PROJECT',
    ];

    if (!validScopeTypes.includes(normalizedScopeType)) {
      throw new BadRequestException(
        `Invalid scopeType. Allowed values: ${validScopeTypes.join(', ')}`,
      );
    }

    const options = await this.adminService.getAssignmentScopeOptions(
      normalizedScopeType,
      {
        tenantId: tenantId ? parseInt(tenantId, 10) : undefined,
        projectId: projectId ? parseInt(projectId, 10) : undefined,
        stateId: stateId ? parseInt(stateId, 10) : undefined,
        districtId: districtId ? parseInt(districtId, 10) : undefined,
        blockId: blockId ? parseInt(blockId, 10) : undefined,
        tehsilId: tehsilId ? parseInt(tehsilId, 10) : undefined,
      },
    );

    return ResponseHelper.success(
      `Scope options fetched for ${normalizedScopeType}`,
      options,
    );
  }
}
