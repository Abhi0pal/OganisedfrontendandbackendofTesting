import { Controller, Get, Post, Body, Query, UseGuards, Request, ParseIntPipe, Param } from '@nestjs/common';
import { InvestorServicesService } from './investor-services.service';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';
import {
  DraftApplicationDto,
  FinalSubmitDto,
  SaveProgressDto,
  SubmitApplicationDto,
} from './dto/submit-application.dto';

@Controller('investor/services')
export class InvestorServicesController {
  constructor(private readonly service: InvestorServicesService) { }

  @Public()
  @Get('departments')
  getDepartments() { return this.service.getDepartments(); }

  @Public()
  @Get('list')
  getServices(
    @Query('departmentId', ParseIntPipe) departmentId: number,
    @Query('category') category: string,
    @Query('locale') locale?: string,
  ) { return this.service.getServices(departmentId, category, locale); }

  @Public()
  @Get('approved-cafs')
  async getApprovedCAFs(@Query('userId', ParseIntPipe) userId: number) {
    return this.service.getApprovedCAFs(userId);
  }

  @Public()
  @Get(':serviceId/form/:formTypeId')
  getFormConfig(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number,
    @Query('locale') locale?: string,
  ) {
    return this.service.getFormConfig(serviceId, formTypeId, locale);
  }

  @Public()
  @Get('master-tables/:masterTableId/options')
  getMasterTableOptions(
    @Param('masterTableId', ParseIntPipe) masterTableId: number,
    @Query('parentValue') parentValue?: string | string[],
    @Query('q') q?: string,
    @Query('take') take?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.service.getMasterTableOptions(masterTableId, parentValue, {
      q,
      take: take ? Number(take) : undefined,
      includeInactive: includeInactive === '1' || includeInactive === 'true',
    });
  }

  @UseGuards(JwtGuard) // 🔒 Must be logged in to submit
  @Post('draft')
  async createDraft(@Request() req: any, @Body() dto: DraftApplicationDto) {
    const userId = req.user?.userId || req.user?.id;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'System';
    return this.service.createOrGetDraft(Number(userId), dto, ip, userAgent);
  }

  @UseGuards(JwtGuard) // 🔒 Must be logged in to submit
  @Post('submit')
  async submitApplication(@Request() req: any, @Body() dto: SubmitApplicationDto) {
    const userId = req.user?.userId || req.user?.id;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'System';
    return this.service.submitApplication(Number(userId), dto, ip, userAgent);
  }

  @UseGuards(JwtGuard)
  @Post('save-progress')
  async saveProgress(@Request() req: any, @Body() dto: SaveProgressDto) {
    const userId = req.user?.userId || req.user?.id;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'System';
    return this.service.saveProgress(Number(userId), dto, ip, userAgent);
  }

  @UseGuards(JwtGuard)
  @Post('final-submit')
  async finalSubmit(@Request() req: any, @Body() dto: FinalSubmitDto) {
    const userId = req.user?.userId || req.user?.id;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'System';
    return this.service.finalSubmit(Number(userId), dto, ip, userAgent);
  }

  @UseGuards(JwtGuard)
  @Post('documents-progress')
  async markDocumentsProgress(@Request() req: any, @Body() dto: FinalSubmitDto) {
    const userId = req.user?.userId || req.user?.id;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'System';
    return this.service.markDocumentsProgress(Number(userId), dto, ip, userAgent);
  }

  @UseGuards(JwtGuard)
  @Get('draft/:submissionId')
  async getDraft(@Param('submissionId', ParseIntPipe) submissionId: number, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.service.getDraft(submissionId, Number(userId));
  }

  @UseGuards(JwtGuard)
  @Get('editable')
  async getEditableSubmission(
    @Query('serviceId') serviceId: string,
    @Query('formTypeId') formTypeId?: string,
    @Query('cafId') cafId?: string,
    @Request() req?: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.service.getEditableSubmission({
      userId: Number(userId),
      serviceId,
      formTypeId: formTypeId ? Number(formTypeId) : undefined,
      cafId: cafId ? Number(cafId) : undefined,
    });
  }

  @UseGuards(JwtGuard) // 🔒 Must be logged in
  @Get('submissions')
  async getUserSubmissions(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.service.getUserSubmissions(Number(userId));
  }

  // ✅ NEW: Endpoint to get a specific submission details
  @UseGuards(JwtGuard)
  @Get('submissions/:id')
  async getSubmissionDetails(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.service.getSubmissionDetails(id, Number(userId));
  }
}
