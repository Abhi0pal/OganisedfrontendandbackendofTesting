import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WorkflowBuilderService } from './workflow-builder.service';
import { WorkflowBuilderEngineService } from './workflow-builder-engine.service';
import { WorkflowBuilderConditionService } from './workflow-builder-condition.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { WorkflowAdminGuard } from './guards/workflow-admin.guard';
import { CreateWorkflowDefDto, UpdateWorkflowDefDto, BulkSaveCanvasDto } from './dto/workflow-builder.dto';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';

@SkipResourceCheck()
@UseGuards(JwtGuard, WorkflowAdminGuard)
@Controller('workflow-builder')
export class WorkflowBuilderController {
  constructor(
    private readonly builderService: WorkflowBuilderService,
    private readonly engineService: WorkflowBuilderEngineService,
    private readonly conditionService: WorkflowBuilderConditionService,
  ) {}

  /** Resolve tenantId from JWT, defaulting to 1 for single-tenant setups */
  private resolveTenantId(req: any): number {
    return Number(req.user?.tenant_id) || 1;
  }

  @Get('hierarchy')
  async getHierarchy(@Request() req) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.getHierarchy(tenantId);
  }

  @Get('roles')
  async getRoles(@Request() req) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.getRoles(tenantId);
  }

  @Get('form-types')
  async getFormTypes() {
    return this.builderService.getFormTypes();
  }

  @Get('condition-fields')
  async getConditionFields(@Query('serviceId') serviceId: string, @Query('departmentId') departmentId: number) {
    return this.conditionService.getConditionFields(serviceId, Number(departmentId));
  }

  @Get('definitions')
  async getDefinitions(@Request() req, @Query('departmentId') departmentId?: number) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.getDefinitions(tenantId, departmentId);
  }

  @Post('definitions')
  async createDefinition(@Request() req, @Body() dto: CreateWorkflowDefDto) {
    const tenantId = this.resolveTenantId(req);
    const userId = req.user?.id;
    return this.builderService.createDefinition(tenantId, userId, dto);
  }

  @Get('definitions/:id')
  async getDefinitionById(@Request() req, @Param('id') id: string) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.getDefinitionById(Number(id), tenantId);
  }

  @Patch('definitions/:id')
  async updateDefinition(@Request() req, @Param('id') id: string, @Body() dto: UpdateWorkflowDefDto) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.updateDefinition(Number(id), tenantId, dto);
  }

  @Delete('definitions/:id')
  async archiveDefinition(@Request() req, @Param('id') id: string) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.archiveDefinition(Number(id), tenantId);
  }

  @Post('definitions/:id/publish')
  async publishDefinition(@Request() req, @Param('id') id: string) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.publishDefinition(Number(id), tenantId);
  }

  @Post('save-canvas')
  async bulkSaveCanvas(@Request() req, @Body() dto: BulkSaveCanvasDto) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.bulkSaveCanvas(tenantId, dto);
  }

  @Get('orphaned')
  async getOrphanedInstances(@Request() req) {
    const tenantId = this.resolveTenantId(req);
    return this.builderService.getOrphanedInstances(tenantId);
  }

  @Post('orphaned/bulk-action')
  async bulkActionOrphaned(@Request() req, @Body() body: { instanceIds: string[]; action: string; targetProcessCode?: string }) {
    const tenantId = this.resolveTenantId(req);
    const userId = req.user?.id;
    const ids = body.instanceIds.map((id) => BigInt(id));
    return this.builderService.bulkActionOrphaned(
      tenantId,
      ids,
      body.action as any,
      body.targetProcessCode || null,
      userId,
    );
  }

  @Get('audit/:instanceId')
  async getAuditTrail(@Param('instanceId') instanceId: string) {
    return this.engineService.getAuditTrail(BigInt(instanceId));
  }
}
