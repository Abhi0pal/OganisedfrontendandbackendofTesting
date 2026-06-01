import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../common/roles-resources.guard';
import { Resource } from '../../common/resource.decorator';
import { WorkflowRuntimeService } from './workflow-runtime.service';
import { WorkflowRuntimeActionDto } from './dto/workflow-runtime-action.dto';
import { RoleDashboardQueryDto } from './dto/role-dashboard-query.dto';
import { ForwardPreviewDto } from './dto/forward-preview.dto';
import { TasksQueryDto } from './dto/tasks-query.dto';
import { VerifyWorkflowDocumentDto } from './dto/verify-workflow-document.dto';

type AuthenticatedRequest = {
  user?: {
    id?: string | number;
    roleId?: string | number;
    role?: { id?: string | number };
  };
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

function parseTasksQuery(query: TasksQueryDto) {
  return {
    roleId: query.roleId,
    jurisdictionLevel: query.jurisdictionLevel
      ? String(query.jurisdictionLevel).trim()
      : undefined,
    status: query.status ? String(query.status).trim().toUpperCase() : 'ACTIVE',
    serviceId: query.serviceId ? String(query.serviceId).trim() : undefined,
    page: query.page,
    limit: query.limit,
  };
}

function getHeaderString(
  headers: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = headers[key];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

@Controller('workflow-runtime')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('DEPARTMENT_DASHBOARD')
export class WorkflowRuntimeController {
  constructor(
    private readonly workflowRuntimeService: WorkflowRuntimeService,
  ) {}

  @Get('tasks')
  async getTasks(@Query() query: TasksQueryDto) {
    return this.workflowRuntimeService.getTasks(parseTasksQuery(query));
  }

  @Get('activities')
  async getActivities(
    @Req() req: AuthenticatedRequest,
    @Query('serviceId') serviceId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    const userRoleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!userId || !userRoleId) {
      throw new BadRequestException('User role not found');
    }
    return this.workflowRuntimeService.getActivities({
      userId,
      userRoleId,
      serviceId,
    });
  }

  @Get('role-dashboard')
  async getRoleDashboard(
    @Req() req: AuthenticatedRequest,
    @Query() query: RoleDashboardQueryDto,
  ) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User role not found');
    }
    const parsedDeptId = Number(query.deptId);
    const parsedStatuses = (query.statuses || '')
      .split(',')
      .map((x) => x.trim().toUpperCase())
      .filter((x) => !!x);

    return this.workflowRuntimeService.getRoleDashboard({
      userId,
      userRoleId: Number(req.user?.roleId || req.user?.role?.id || 0),
      serviceId: query.serviceId,
      deptId:
        Number.isFinite(parsedDeptId) && parsedDeptId > 0
          ? parsedDeptId
          : undefined,
      statuses: parsedStatuses.length ? parsedStatuses : undefined,
      processingLevel: query.processingLevel
        ? String(query.processingLevel).trim()
        : undefined,
    });
  }

  @Get('activity')
  async getActivityDetail(
    @Req() req: AuthenticatedRequest,
    @Query('submissionId') submissionId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    const userRoleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    const parsedId = Number(submissionId);
    if (!userId || !userRoleId) {
      throw new BadRequestException('User role not found');
    }
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.workflowRuntimeService.getActivityDetail({
      userId,
      userRoleId,
      submissionId: parsedId,
    });
  }

  @Get('application-view')
  async getApplicationView(@Query('submissionId') submissionId?: string) {
    const parsedId = Number(submissionId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.workflowRuntimeService.getApplicationView({
      submissionId: parsedId,
    });
  }

  @Get('documents')
  async getDocuments(
    @Query('submissionId') submissionId?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const parsedId = Number(submissionId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.workflowRuntimeService.getDocuments({
      submissionId: parsedId,
      serviceId,
    });
  }

  @Get('timeline')
  async getTimeline(@Query('submissionId') submissionId?: string) {
    const parsedId = Number(submissionId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.workflowRuntimeService.getTimeline({ submissionId: parsedId });
  }

  @Post('documents/verify')
  async verifyDocument(
    @Req() req: AuthenticatedRequest,
    @Body() body: VerifyWorkflowDocumentDto,
  ) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    return this.workflowRuntimeService.verifyDocument({
      submissionId: body.submissionId,
      documentsId: body.documentsId,
      status: body.status,
      comments: body.comments || '',
      isDraft: body.isDraft === '1' ? '1' : '0',
      userId,
      remoteIp: req.ip || '',
      userAgent: getHeaderString(req.headers, 'user-agent'),
      serviceId: body.serviceId, // optional, used for incentive flows
    });
  }

  @Post('action')
  async submitAction(
    @Req() req: AuthenticatedRequest,
    @Body() data: WorkflowRuntimeActionDto,
  ) {
    const userId = BigInt(req.user?.id || 0);
    const userRoleId = Number(req.user?.roleId || req.user?.role?.id || 0);

    if (!userId || !userRoleId) {
      throw new BadRequestException('User role not found');
    }

    return this.workflowRuntimeService.processAction({
      submissionId: data.submissionId,
      step: data.step,
      serviceId: data.serviceId,
      action: data.action,
      processingLevel: data.processingLevel,
      comments: data.comments,
      nextRoleId: data.nextRoleId,
      nextRoleIds: data.nextRoleIds,
      nextUserId: data.nextUserId,
      nextUserIds: data.nextUserIds,
      reasonForDelay: data.reasonForDelay,
      supportiveDocument: data.supportiveDocument,
      forwardedDeptIds: data.forwardedDeptIds,
      forwardedDistId: data.forwardedDistId,
      stateId: data.stateId,
      blockPayload: data.blockPayload,
      selectedRecipients: data.selectedRecipients,
      userId,
      userRoleId,
      ipAddress: req.ip || '',
      userAgent: getHeaderString(req.headers, 'user-agent'),
    });
  }

  @Get('inbox')
  async getInbox(
    @Req() req: AuthenticatedRequest,
    @Query('serviceId') serviceId?: string,
    @Query('tab') tab?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    const userRoleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!userId || !userRoleId) {
      throw new BadRequestException('User role not found');
    }
    return this.workflowRuntimeService.listInbox({
      userId,
      userRoleId,
      serviceId: serviceId ? String(serviceId).trim() : undefined,
      tab: tab ? String(tab).trim() : undefined,
      page:
        Number.isFinite(Number(page)) && Number(page) > 0
          ? Number(page)
          : undefined,
      limit:
        Number.isFinite(Number(limit)) && Number(limit) > 0
          ? Number(limit)
          : undefined,
    });
  }
}

@Controller(['workflow', 'api/workflow'])
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('DEPARTMENT_DASHBOARD')
export class WorkflowTasksController {
  constructor(
    private readonly workflowRuntimeService: WorkflowRuntimeService,
  ) {}

  @Get('tasks')
  async getTasks(@Query() query: TasksQueryDto) {
    return this.workflowRuntimeService.getTasks(parseTasksQuery(query));
  }

  @Post('forward/preview')
  async previewForwardRecipients(@Body() body: ForwardPreviewDto) {
    const appSubId = Number(body?.appSubId ?? body?.submissionId);
    const step = Number(body?.step);
    const action = String(body?.action || '').toUpperCase();
    const forwardedDeptIds = Array.isArray(body?.forwardedDeptIds)
      ? body.forwardedDeptIds
      : Array.isArray(body?.departmentIds)
        ? body.departmentIds
        : [];
    const parsedForwardedDeptIds = forwardedDeptIds
      .map((value: unknown) => Number(value))
      .filter((value: number) => Number.isFinite(value) && value > 0);
    const forwardedDistId = Number(
      body?.forwardedDistId ?? body?.districtId ?? NaN,
    );
    const stateId =
      Number.isFinite(Number(body?.stateId)) && Number(body?.stateId) > 0
        ? Number(body.stateId)
        : undefined;

    if (!Number.isFinite(appSubId) || appSubId <= 0) {
      throw new BadRequestException('appSubId/submissionId is required');
    }
    if (!Number.isFinite(step) || step <= 0) {
      throw new BadRequestException('step is required');
    }
    if (action !== 'FORWARD') {
      throw new BadRequestException('Only FORWARD action is supported');
    }

    return this.workflowRuntimeService.previewForwardRecipients({
      appSubId,
      step,
      action: 'FORWARD',
      forwardedDeptIds: parsedForwardedDeptIds,
      jurisdictionLevel: body?.jurisdictionLevel
        ? String(body.jurisdictionLevel).trim()
        : undefined,
      forwardedDistId:
        Number.isFinite(forwardedDistId) && forwardedDistId > 0
          ? forwardedDistId
          : undefined,
      stateId,
    });
  }
}
