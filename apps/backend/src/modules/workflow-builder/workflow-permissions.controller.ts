import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { WorkflowPermissionsService } from './workflow-permissions.service';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';

@SkipResourceCheck()
@UseGuards(JwtGuard)
@Controller('workflow-builder/permissions')
export class WorkflowPermissionsController {
  constructor(private readonly permissionsService: WorkflowPermissionsService) {}

  @SkipResourceCheck()
  @Get(':processId')
  async getPermissions(@Param('processId', ParseIntPipe) processId: number) {
    return this.permissionsService.getPermissionsByProcess(processId);
  }

  @SkipResourceCheck()
  @Post('bulk/:processId')
  async saveBulk(
    @Param('processId', ParseIntPipe) processId: number,
    @Body() permissions: any[],
  ) {
    return this.permissionsService.saveBulkPermissions(processId, permissions);
  }

  @SkipResourceCheck()
  @Get('effective/:processId/:roleId')
  async getEffective(
    @Param('processId', ParseIntPipe) processId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.permissionsService.getEffectivePermissions(processId, roleId);
  }
}
