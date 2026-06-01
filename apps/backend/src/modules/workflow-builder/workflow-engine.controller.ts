import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WorkflowBuilderEngineService } from './workflow-builder-engine.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';
import { StartWorkflowDto, ExecuteActionDto } from './dto/workflow-engine.dto';

@SkipResourceCheck()
@UseGuards(JwtGuard)
@Controller('workflow-engine')
export class WorkflowEngineController {
  constructor(private readonly engineService: WorkflowBuilderEngineService) {}

  private resolveTenantId(req: any): number {
    return Number(req.user?.tenant_id) || 1;
  }

  // ─── START A WORKFLOW ──────────────────────────────────
  @Post('start')
  async startWorkflow(@Request() req, @Body() dto: StartWorkflowDto) {
    const tenantId = this.resolveTenantId(req);
    return this.engineService.startInstance({
      tenantId,
      departmentId: dto.departmentId,
      serviceId: dto.serviceId,
      applicationId: BigInt(dto.applicationId),
    });
  }

  // ─── EXECUTE AN ACTION (FORWARD, APPROVE, REJECT, ETC) ──
  @Post('execute')
  async executeAction(@Request() req, @Body() dto: ExecuteActionDto) {
    const userId = req.user?.id;
    return this.engineService.executeAction({
      forwardLevelId: BigInt(dto.forwardLevelId),
      actionCode: dto.actionCode,
      actorUserId: BigInt(userId),
      actorRoleId: dto.actorRoleId,
      remarks: dto.remarks,
      applicationData: dto.applicationData,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  // ─── GET TASKS (for Officer Task Dashboard) ─────────────
  @Get('tasks')
  async getTasks(
    @Request() req,
    @Query('roleId') roleId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user?.tenant_id;
    return this.engineService.getTasks({
      tenantId,
      roleId: roleId ? Number(roleId) : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  // ─── GET SINGLE INSTANCE DETAIL ─────────────────────────
  @Get('instances/:id')
  async getInstanceDetail(@Param('id') id: string) {
    return this.engineService.getInstanceDetail(BigInt(id));
  }

  // ─── GET INSTANCES BY APPLICATION ───────────────────────
  @Get('application/:applicationId')
  async getInstancesByApplication(@Param('applicationId') applicationId: string) {
    return this.engineService.getInstancesByApplication(BigInt(applicationId));
  }

  // ─── AUDIT TRAIL ───────────────────────────────────────
  @Get('audit/:forwardLevelId')
  async getAuditTrail(@Param('forwardLevelId') forwardLevelId: string) {
    return this.engineService.getAuditTrail(BigInt(forwardLevelId));
  }

  // ─── DASHBOARD STATS ──────────────────────────────────
  @Get('dashboard/stats')
  async getDashboardStats(
    @Request() req,
    @Query('departmentId') departmentId?: string,
  ) {
    const tenantId = req.user?.tenant_id;
    return this.engineService.getDashboardStats(
      tenantId,
      departmentId ? Number(departmentId) : undefined,
    );
  }

  // ─── FIND PUBLISHED WORKFLOW ──────────────────────────
  @Get('published')
  async findPublishedWorkflow(
    @Request() req,
    @Query('departmentId') departmentId: string,
    @Query('serviceId') serviceId?: string,
    @Query('moduleId') moduleId?: string,
  ) {
    const tenantId = req.user?.tenant_id;
    return this.engineService.findPublishedWorkflow(
      tenantId,
      Number(departmentId),
      serviceId || undefined,
      moduleId ? Number(moduleId) : undefined,
    );
  }

  // ---------------------------------------------------------
  // FORM BINDING & SUBMISSION (PHASE 3)
  // ---------------------------------------------------------

  @Get('form/applicant/:workflowDefId')
  async getApplicantForm(@Param('workflowDefId') workflowDefId: string) {
    return this.engineService.getApplicantForm(Number(workflowDefId));
  }

  @Get('form/step/:forwardLevelId')
  async getProcessingForm(@Param('forwardLevelId') forwardLevelId: string) {
    return this.engineService.getProcessingForm(BigInt(forwardLevelId));
  }

  @Get('form/:serviceId/:formTypeId')
  async getFormStructure(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId') formTypeId: string,
  ) {
    return this.engineService.getFormStructure(serviceId, Number(formTypeId));
  }

  @Post('form/submit')
  async submitFormData(@Request() req, @Body() dto: any) {
    if (!dto.applicationId || !dto.serviceId || !dto.departmentId) {
      throw new BadRequestException('applicationId, serviceId, departmentId are required');
    }
    const userId = req.user?.id;
    return this.engineService.saveSubmissionData({
      applicationId: BigInt(dto.applicationId),
      serviceId: dto.serviceId,
      departmentId: Number(dto.departmentId),
      userId: BigInt(userId),
      formData: dto.formData,
      formTypeId: dto.formTypeId ? Number(dto.formTypeId) : undefined,
    });
  }
}

