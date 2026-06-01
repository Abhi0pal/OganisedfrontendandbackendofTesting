import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

// 👇 ADD THIS IMPORT (required for public routes)
import { Public } from '../../../common/public.decorator';
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * POST /permissions
   * Create a new permission
   */
  @Public()   // 👈 make public
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  /**
   * GET /permissions
   * Get all permissions
   */
  @Public()   // 👈 make public
  @Get()
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('moduleId') moduleId?: string,
    @Query('action') action?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.permissionService.findAll(
      parseInt(skip),
      parseInt(take),
      moduleId ? parseInt(moduleId) : undefined,
      action as any,
      isActive ? isActive === 'true' : undefined,
    );
  }

  /**
   * GET /permissions/module/:moduleId/available
   */
  @Public()   // 👈 make public
  @Get('module/:moduleId/available')
  async getAvailableActions(@Param('moduleId') moduleId: string) {
    return this.permissionService.getAvailableActions(parseInt(moduleId));
  }

  /**
   * GET /permissions/module/:moduleId
   */
  @Public()   // 👈 make public
  @Get('module/:moduleId')
  async findByModule(
    @Param('moduleId') moduleId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.permissionService.findByModule(
      parseInt(moduleId),
      parseInt(skip),
      parseInt(take),
    );
  }

  /**
   * GET /permissions/:id
   */
  @Public()   // 👈 make public
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.permissionService.findOne(parseInt(id));
  }

  /**
   * PATCH /permissions/bulk/status
   */
  @Public()   // 👈 make public
  @Patch('bulk/status')
  async bulkUpdateActive(
    @Body() body: { ids: number[]; isActive: boolean },
  ) {
    return this.permissionService.bulkUpdateActive(body.ids, body.isActive);
  }

  /**
   * PATCH /permissions/:id
   */
  @Public()   // 👈 make public
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(parseInt(id), updatePermissionDto);
  }

  /**
   * DELETE /permissions/:id
   */
  @Public()   
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.permissionService.remove(parseInt(id));
  }
}