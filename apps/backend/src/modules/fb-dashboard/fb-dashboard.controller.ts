import { Controller, Get, Post, Body, Query, Req, UseGuards, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { FbDashboardService } from './fb-dashboard.service';
import { Public } from '../../common/public.decorator';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';

type AuthReq = {
  user?: { id?: string | number; roleId?: string | number; role?: { id?: string | number } };
  ip?: string;
};

@Controller('fb-dashboard')
@UseGuards(JwtGuard)
@SkipResourceCheck()
export class FbDashboardController {
  constructor(private readonly service: FbDashboardService) {}

  @Public()
  @Get('debug')
  async getDebug(@Query('roleId') roleId?: string) {
    const userRoleId = Number(roleId || 4);
    const fwdRows = await (this.service as any).prisma.forwardApplication.findMany({
      where: { nextRoleId: userRoleId, appSubId: { not: null } },
      select: { appSubId: true, nextUserId: true, forwardedDeptId: true, forwardedDistId: true, approvStatus: true },
      take: 20,
    });
    return { userRoleId, forwardRowsCount: fwdRows.length, forwardRows: fwdRows };
  }

  @Public()
  @Get('debug-officer-form')
  async debugOfficerForm(
    @Query('submissionId') submissionId?: string,
    @Query('roleId')       roleId?: string,
  ) {
    const prisma    = (this.service as any).prisma;
    const subId     = Number(submissionId || 10000);
    const rId       = Number(roleId || 4);

    const submission = await prisma.applicationSubmission.findUnique({
      where: { submissionId: subId },
      select: { submissionId: true, serviceId: true },
    });

    const wfConfigAll = await prisma.applicationWorkflowConfiguration.findMany({
      where: { serviceId: submission?.serviceId },
      select: { formTypeId: true, step: true, status: true, roleId: true, currentRoleId: true, serviceId: true },
    });

    const wfConfigForRole = await prisma.applicationWorkflowConfiguration.findMany({
      where: {
        serviceId: submission?.serviceId,
        OR: [{ roleId: rId }, { currentRoleId: rId }],
      },
      select: { formTypeId: true, step: true, status: true, roleId: true, currentRoleId: true },
    });

    const builderFieldsFormId7 = submission?.serviceId ? await prisma.formBuilderField.findMany({
      where: { service_id: submission.serviceId, form_id: 7 },
      select: { id: true, form_id: true, service_id: true, is_active: true, category_id: true },
      take: 10,
    }) : [];

    const allFormIds = submission?.serviceId
      ? await prisma.formBuilderField.findMany({
          where: { service_id: submission.serviceId },
          select: { form_id: true },
          distinct: ['form_id'],
        })
      : [];

    const formMapping7 = submission?.serviceId
      ? await prisma.formMapping.findFirst({
          where: { service_id: submission.serviceId, form_type_id: 7 },
          select: { id: true, form_name: true, form_type_id: true, service_id: true, is_active: true },
        })
      : null;

    return {
      submission,
      wfConfigForRole,
      distinctFormIdsInBuilderFields: allFormIds,
      builderFieldsFormId7,
      formMapping7,
    };
  }

  @Get('inbox')
  async getInbox(
    @Req() req: AuthReq,
    @Query('tab')       tab?: string,
    @Query('serviceId') serviceId?: string,
    @Query('page')      page?: string,
    @Query('limit')     limit?: string,
  ) {
    const userId     = BigInt(req.user?.id || 0);
    const userRoleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!userId || !userRoleId) throw new BadRequestException('User not authenticated');

    return this.service.getInbox({
      userId,
      userRoleId,
      tab:       tab       ? String(tab).trim()       : undefined,
      serviceId: serviceId ? String(serviceId).trim() : undefined,
      page:  Number.isFinite(Number(page))  && Number(page)  > 0 ? Number(page)  : 1,
      limit: Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20,
    });
  }

  @Get('print-data')
  async getPrintData(@Query('submissionId') submissionId?: string) {
    const id = Number(submissionId);
    if (!id || !Number.isFinite(id)) throw new BadRequestException('submissionId is required');
    return this.service.getPrintData(id);
  }

  @Get('timeline')
  async getTimeline(@Query('submissionId') submissionId?: string) {
    const id = Number(submissionId);
    if (!id || !Number.isFinite(id)) throw new BadRequestException('submissionId is required');
    return this.service.getFbTimeline(id);
  }

  @Get('application-view')
  async getApplicationView(@Query('submissionId') submissionId?: string) {
    const id = Number(submissionId);
    if (!id || !Number.isFinite(id)) throw new BadRequestException('submissionId is required');
    return this.service.getApplicationView(id);
  }

  @Get('officer-form')
  async getOfficerForm(@Req() req: AuthReq, @Query('submissionId') submissionId?: string) {
    const id     = Number(submissionId);
    const userId = Number(req.user?.id || 0);
    const roleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!id || !Number.isFinite(id)) throw new BadRequestException('submissionId is required');
    if (!roleId) throw new BadRequestException('User not authenticated');
    return this.service.getOfficerForm(id, roleId, userId);
  }

  @Get('document-verification')
  async getDocumentVerification(@Req() req: AuthReq, @Query('submissionId') submissionId?: string) {
    const id     = Number(submissionId);
    const roleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!id) throw new BadRequestException('submissionId is required');
    return this.service.getDocumentVerification(id, roleId);
  }

  @Post('upload-supportive-doc')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'supportiveDocuments');
          if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const submissionId = (req as any).body?.submissionId || 'unknown';
          const timestamp    = Date.now();
          const ext          = extname(file.originalname);
          const safeName     = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${submissionId}_${timestamp}_${safeName}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ];
        allowed.includes(file.mimetype)
          ? cb(null, true)
          : cb(new BadRequestException(`Invalid file type: ${file.mimetype}`), false);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async uploadSupportiveDoc(@UploadedFile() file: any, @Req() req: any) {
    const uploadedFile = file || req.file;
    if (!uploadedFile) throw new BadRequestException('No file uploaded');
    return { success: true, filename: uploadedFile.filename };
  }

  @Post('challan-estimate')
  async getChallanEstimate(
    @Req() req: AuthReq,
    @Body() body: { submissionId: number; applicationData?: any },
  ) {
    const userId = Number(req.user?.id || 0);
    const roleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!userId || !roleId) throw new BadRequestException('User not authenticated');
    if (!body.submissionId) throw new BadRequestException('submissionId is required');

    return this.service.getChallanEstimate(Number(body.submissionId), body.applicationData);
  }

  @Post('submit-action')
  async submitOfficerAction(
    @Req() req: AuthReq,
    @Body() body: { submissionId: number; action: string; comment: string; supportiveDocument?: string; applicationData?: any },
  ) {
    const userId = Number(req.user?.id || 0);
    const roleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!userId || !roleId) throw new BadRequestException('User not authenticated');
    if (!body.submissionId)  throw new BadRequestException('submissionId is required');

    return this.service.submitOfficerAction({
      submissionId:      Number(body.submissionId),
      roleId,
      userId,
      action:            body.action,
      comment:           body.comment || '',
      supportiveDocument: body.supportiveDocument,
      applicationData:   body.applicationData,
      userAgent:         String((req as any).headers?.['user-agent'] || '').slice(0, 255),
    });
  }

  @Post('verify-document')
  async verifyDocument(
    @Req() req: AuthReq,
    @Body() body: { mappingId: number; status: string; comments: string },
  ) {
    const deptUserId = Number(req.user?.id || 0);
    if (!body.mappingId) throw new BadRequestException('mappingId is required');
    if (!['V', 'R', 'M'].includes(body.status)) throw new BadRequestException('status must be V, R or M');
    return this.service.verifyDocument({ ...body, deptUserId });
  }

  @Get('counts')
  async getCounts(@Req() req: AuthReq) {
    const userId     = BigInt(req.user?.id || 0);
    const userRoleId = Number(req.user?.roleId || req.user?.role?.id || 0);
    if (!userId || !userRoleId) throw new BadRequestException('User not authenticated');

    return this.service.getCounts({ userId, userRoleId });
  }
}
