import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';


@Controller('role-permissions')
@Resource('MASTER_ROLES')
export class RolePermissionController {
  constructor(private readonly service: RolePermissionService) {}

  /**
   * Create role-permission mapping
   */
  @Post()
  create(
    @Body() dto: CreateRolePermissionDto,
    @Req() req: any,
  ) {
    return this.service.create(dto, BigInt(req.user.id));
  }

  /**
   * Get all role-permission mappings
   */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * Get single role-permission by ID
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id);
  }

  /**
   * Get active permissions by role ID
   */
  @Get('by-role/:roleId')
  findByRole(
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.service.findByRole(roleId);
  }

  /**
   * Update role-permission
   * (effect / is_active only)
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolePermissionDto,
  ) {
    return this.service.update(id, dto);
  }

  /**
   * HARD delete role-permission
   * (use cautiously)
   */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(id);
  }
}