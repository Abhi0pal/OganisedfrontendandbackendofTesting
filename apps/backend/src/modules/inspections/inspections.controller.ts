import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { InspectionsService } from './inspections.service';
import { CreateInspectionChecklistDto } from './dto/create-inspection-checklist.dto';
import { ChatDto } from './dto/chat.dto';
import { Resource } from '../../common/resource.decorator';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';
import { AiService } from '../../ai/ai.service';

@Controller('inspections')
export class InspectionsController {
    constructor(
        private readonly inspectionsService: InspectionsService,
        private readonly aiService: AiService // Added AiService injection
    ) { }

    // ===================================
    // CHECKLIST MANAGEMENT (Admin)
    // ===================================

    @Resource('MASTER_ALL')
    @Post('checklists')
    createChecklist(@Body() createChecklistDto: CreateInspectionChecklistDto) {
        return this.inspectionsService.createChecklist(createChecklistDto);
    }

    @Resource('MASTER_ALL')
    @Get('checklists')
    findAllChecklists(@Query('serviceId') serviceId?: string) {
        return this.inspectionsService.findAllChecklists(serviceId ? +serviceId : undefined);
    }

    @Resource('MASTER_ALL')
    @Get('checklists/:id')
    findOneChecklist(@Param('id') id: string) {
        return this.inspectionsService.findOneChecklist(+id);
    }

    @Resource('MASTER_ALL')
    @Put('checklists/:id')
    updateChecklist(@Param('id') id: string, @Body() updateChecklistDto: CreateInspectionChecklistDto) {
        return this.inspectionsService.updateChecklist(+id, updateChecklistDto);
    }

    @Resource('MASTER_ALL')
    @Delete('checklists/:id')
    deleteChecklist(@Param('id') id: string) {
        return this.inspectionsService.deleteChecklist(+id);
    }

    // ===================================
    // CHECKLIST MANAGEMENT (JD Portal)
    // ===================================

    @Resource('JD_PORTAL')
    @Post('jd-portal/checklists')
    createChecklistJD(@Body() createChecklistDto: CreateInspectionChecklistDto, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.createChecklistForDepartment(userId, createChecklistDto);
    }

    @Resource('JD_PORTAL')
    @Get('jd-portal/checklists')
    findAllChecklistsJD(@Query('serviceId') serviceId: string, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.findAllChecklistsForDepartment(userId, serviceId ? +serviceId : undefined);
    }

    @Resource('JD_PORTAL')
    @Get('jd-portal/checklists/:id')
    findOneChecklistJD(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.findOneChecklistForDepartment(userId, +id);
    }

    @Resource('JD_PORTAL')
    @Put('jd-portal/checklists/:id')
    updateChecklistJD(@Param('id') id: string, @Body() updateChecklistDto: CreateInspectionChecklistDto, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.updateChecklistForDepartment(userId, +id, updateChecklistDto);
    }

    @Resource('JD_PORTAL')
    @Delete('jd-portal/checklists/:id')
    deleteChecklistJD(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.deleteChecklistForDepartment(userId, +id);
    }

    // ===================================
    // INSPECTION TRANSACTIONS (Investor facing)
    // ===================================

    @Resource('INVESTOR_DASHBOARD')
    @Get('my-inspections')
    async getMyInspections(@Req() req: any) {
        const userId = req.user?.id || '1'; // Get from JWT
        return this.inspectionsService.findInspectionsByInvestor(userId);
    }

    @Resource('INVESTOR_DASHBOARD')
    @Get('transactions/:id')
    async getInspectionDetail(@Param('id') id: string) {
        return this.inspectionsService.findInspectionById(id);
    }

    // Admin/Department can create inspections
    @Resource('MASTER_ALL')
    @Post('transactions')
    async createInspection(@Body() data: any) {
        return this.inspectionsService.createInspection(data);
    }

    @Resource('MASTER_ALL')
    @Put('transactions/:id/status')
    async updateInspectionStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.inspectionsService.updateInspectionStatus(id, status);
    }

    // ===================================
    // OBSERVATIONS & RESPONSES
    // ===================================

    @Resource('MASTER_ALL')
    @Post('transactions/:id/observations')
    async addObservation(@Param('id') inspectionId: string, @Body() data: any) {
        return this.inspectionsService.addObservation(inspectionId, data);
    }



    // ===================================
    // SWS: INSPECTOR WORKFLOW (Department User)
    // ===================================

    @Resource('MASTER_ALL') // TODO: Change to DEPARTMENT_INSPECTIONS when resource is created
    @Get('assigned')
    async getAssignedInspections(@Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.findAssignedInspections(userId);
    }

    @Resource('MASTER_ALL')
    @Post('transactions/:id/checklist-responses')
    async submitChecklistResponses(
        @Param('id') inspectionId: string,
        @Body() body: {
            responses: Array<{
                checklistItemId: number;
                response: string;
                remarks?: string;
                evidenceUrls?: string[];
            }>;
        },
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.submitChecklistResponses(
            inspectionId,
            body.responses,
            userId
        );
    }

    @Resource('MASTER_ALL')
    @Post('transactions/:id/finalize')
    async finalizeReport(@Param('id') inspectionId: string, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.finalizeReport(inspectionId, userId);
    }

    @Resource('MASTER_ALL')
    @Post('transactions/:id/submit-approval')
    async submitForApproval(@Param('id') inspectionId: string, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.submitForApproval(inspectionId, userId);
    }

    // ===================================
    // SWS: INVESTOR SELF-REPORTING
    // ===================================

    @Resource('INVESTOR_DASHBOARD')
    @Get('transactions/:id/checklist-responses')
    async getInvestorChecklistResponses(@Param('id') inspectionId: string, @Req() req: any) {
        const userId = req.user?.id ? BigInt(req.user.id) : BigInt(1);
        return this.inspectionsService.getInvestorChecklistResponses(inspectionId, userId);
    }

    @Resource('INVESTOR_DASHBOARD')
    @Post('transactions/:id/checklist-responses/single')
    async submitInvestorChecklistResponse(
        @Param('id') inspectionId: string,
        @Body() body: {
            checklistItemId: number;
            response: string;
            remarks?: string;
            evidenceUrls?: string[];
            evidenceFiles?: { name: string; type: string; base64: string }[];
        },
        @Req() req: any
    ) {
        const userId = req.user?.id ? BigInt(req.user.id) : BigInt(1);
        return this.inspectionsService.submitInvestorChecklistResponse(
            inspectionId,
            body.checklistItemId,
            body.response,
            body.remarks || '',
            body.evidenceUrls || [],
            body.evidenceFiles || [],
            userId
        );
    }

    @Resource('INVESTOR_DASHBOARD')
    @Post('observations/:id/respond')
    async respondToObservation(
        @Param('id') observationId: string,
        @Body() body: { message: string; attachments?: string[] },
        @Req() req: any
    ) {
        const userId = req.user?.id ? BigInt(req.user.id) : BigInt(1);
        return this.inspectionsService.respondToObservation(
            observationId,
            body.message,
            body.attachments || [],
            userId
        );
    }

    // ===================================
    // SWS: EVIDENCE MANAGEMENT
    // ===================================

    @Resource('INVESTOR_DASHBOARD')
    @Post('transactions/:id/evidence')
    async uploadEvidence(
        @Param('id') inspectionId: string,
        @Body() data: {
            checklistItemId?: number;
            fileType: string;
            fileUrl: string;
            fileName?: string;
            fileSize?: number;
            geoTag?: { lat: number; lng: number };
        },
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        const uploaderRole = req.user?.user_type || 'INVESTOR';
        return this.inspectionsService.uploadEvidence(inspectionId, data, userId, uploaderRole);
    }

    @Resource('INVESTOR_DASHBOARD')
    @Get('transactions/:id/evidence')
    async getEvidence(@Param('id') inspectionId: string) {
        return this.inspectionsService.getEvidenceByInspection(inspectionId);
    }

    // ===================================
    // SWS: FEEDBACK
    // ===================================

    @Resource('INVESTOR_DASHBOARD')
    @Post('transactions/:id/feedback')
    async submitFeedback(
        @Param('id') inspectionId: string,
        @Body() body: { rating: number; comment?: string },
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.submitFeedback(
            inspectionId,
            body.rating,
            body.comment || null,
            userId
        );
    }

    @Resource('INVESTOR_DASHBOARD')
    @Get('transactions/:id/feedback')
    async getFeedback(@Param('id') inspectionId: string) {
        return this.inspectionsService.getFeedback(inspectionId);
    }

    // ===================================
    // SWS: AUDIT LOGS
    // ===================================

    @Resource('MASTER_ALL')
    @Get('transactions/:id/audit-logs')
    async getAuditLogs(@Param('id') inspectionId: string) {
        return this.inspectionsService.getAuditLogs(inspectionId);
    }

    // ===================================
    // SWS: ANALYTICS (CIS Dashboard)
    // ===================================

    @Resource('MASTER_ALL')
    @Get('analytics')
    async getAnalytics(@Query('departmentId') departmentId?: string) {
        return this.inspectionsService.getInspectionAnalytics(
            departmentId ? +departmentId : undefined
        );
    }

    // ===================================
    // SWS: SLA MONITORING
    // ===================================

    @Resource('MASTER_ALL')
    @Get('sla/check-breaches')
    async checkSlaBreaches() {
        return this.inspectionsService.checkSlaBreaches();
    }

    @Resource('INVESTOR_DASHBOARD')
    @Post('transactions/:id/mark-viewed')
    async markAsViewed(@Param('id') inspectionId: string) {
        return this.inspectionsService.markApplicantViewed(inspectionId);
    }

    // ===================================
    // JD PORTAL ENDPOINTS
    // ===================================

    @Resource('JD_PORTAL')
    @Get('jd-portal/unassigned')
    async getUnassignedAllocations(@Req() req: any, @Query('departmentId') departmentId?: string) {
        const resolvedDeptId = req.user?.deptId || (departmentId ? +departmentId : undefined);
        return this.inspectionsService.getUnassignedAllocations(resolvedDeptId);
    }

    @Resource('JD_PORTAL')
    @Get('jd-portal/inspectors')
    async getInspectorsByDepartment(
        @Req() req: any,
        @Query('departmentId') departmentId: string,
        @Query('type') type?: 'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY'
    ) {
        const resolvedDeptId = req.user?.deptId || +departmentId;
        return this.inspectionsService.getInspectorsByDepartment(
            resolvedDeptId,
            type || 'DEPARTMENT_OFFICIAL'
        );
    }

    @Resource('JD_PORTAL')
    @Post('jd-portal/allocate')
    async allocateInspection(
        @Body() body: {
            inspectionId: string;
            inspectorType: 'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY';
            inspectorId: number;
            scheduledDate: string;
            priority?: 'HIGH' | 'NORMAL';
            riskCategory?: 'HIGH' | 'MEDIUM' | 'LOW';
        },
        @Req() req: any
    ) {
        const jdUserId = BigInt(req.user?.id || '1');
        if (req.user?.deptId) {
            // In a real app we'd verify the assigned inspector belongs to the dept.
            // But at minimum, the UI restricts inspector selection based on department fetching.
        }

        return this.inspectionsService.allocateInspection(
            body.inspectionId,
            {
                inspectorType: body.inspectorType,
                inspectorId: body.inspectorId,
                scheduledDate: new Date(body.scheduledDate),
                priority: body.priority,
                riskCategory: body.riskCategory,
            },
            jdUserId
        );
    }

    @Resource('JD_PORTAL')
    @Get('jd-portal/stats')
    async getJdDashboardStats(@Req() req: any, @Query('departmentId') departmentId: string) {
        const resolvedDeptId = req.user?.deptId || +departmentId;
        return this.inspectionsService.getJdDashboardStats(resolvedDeptId);
    }

    // JD REVIEW ENDPOINTS

    @Resource('JD_PORTAL')
    @Put('jd-portal/responses/:responseId/review')
    async reviewChecklistResponse(
        @Param('responseId') responseId: string,
        @Body() body: { isApproved: boolean; rejectionReason?: string },
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.reviewChecklistResponse(
            responseId,
            body.isApproved,
            body.rejectionReason || null,
            userId
        );
    }

    @Resource('JD_PORTAL')
    @Post('jd-portal/transactions/:id/publish')
    async publishReport(
        @Param('id') inspectionId: string,
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.publishReport(inspectionId, userId);
    }

    // ===================================
    // CIS DASHBOARD ENDPOINTS
    // ===================================

    @Resource('DEPARTMENT_DASHBOARD')
    @Get('cis/dashboard')
    async getCISDashboard(@Req() req: any, @Query('financialYear') financialYear?: string) {
        const resolvedDeptId = req.user?.deptId;
        return this.inspectionsService.getCISInspectionDashboard(financialYear || '2025-2026', resolvedDeptId);
    }

    @Resource('DEPARTMENT_DASHBOARD')
    @Get('cis/report')
    async getCISReport(
        @Req() req: any,
        @Query('financialYear') financialYear?: string,
        @Query('departmentId') departmentId?: string,
        @Query('districtId') districtId?: string,
        @Query('riskCategory') riskCategory?: string,
        @Query('status') status?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('rescheduleRequested') rescheduleRequested?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const resolvedDeptId = req.user?.deptId || (departmentId ? +departmentId : undefined);
        return this.inspectionsService.getCISInspectionReport({
            financialYear,
            departmentId: resolvedDeptId,
            districtId: districtId ? +districtId : undefined,
            riskCategory,
            status,
            rescheduleRequested: rescheduleRequested === 'true',
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined,
            sortBy,
            sortOrder,
            page: page ? +page : 1,
            limit: limit ? +limit : 50,
        });
    }

    @Resource('DEPARTMENT_DASHBOARD')
    @Get('cis/detail/:id')
    async getCISInspectionDetail(@Param('id') id: string) {
        return this.inspectionsService.getCISInspectionDetail(id);
    }

    @SkipResourceCheck()
    @Get('cis/districts')
    async getCISDistricts() {
        return this.inspectionsService.getCISDistricts();
    }

    @SkipResourceCheck()
    @Get('cis/departments')
    async getCISDepartments() {
        return this.inspectionsService.getCISDepartments();
    }

    @SkipResourceCheck()
    @Get('cis/units')
    async getApplicationUnits(@Query('districtId') districtId?: string) {
        return this.inspectionsService.getApplicationUnits(
            districtId ? +districtId : undefined
        );
    }

    @SkipResourceCheck()
    @Get('cis/inspectors/recommend')
    async getCISRecommendedInspector(
        @Query('departmentId') departmentId: string,
        @Query('inspectorType') inspectorType?: string,
        @Query('districtId') districtId?: string
    ) {
        const type = inspectorType === 'THIRD_PARTY' ? 'THIRD_PARTY' : 'DEPARTMENT_OFFICIAL';
        return this.inspectionsService.getRecommendedInspector(+departmentId, type, districtId ? +districtId : undefined);
    }

    @SkipResourceCheck()
    @Get('cis/inspectors/:departmentId')
    async getDepartmentInspectors(
        @Param('departmentId') departmentId: string,
        @Query('inspectorType') inspectorType?: string,
        @Query('districtId') districtId?: string
    ) {
        const type = inspectorType === 'THIRD_PARTY' ? 'THIRD_PARTY' : 'DEPARTMENT_OFFICIAL';
        return this.inspectionsService.getInspectorsByDepartment(+departmentId, type, districtId ? +districtId : undefined);
    }

    @Resource('DEPARTMENT_DASHBOARD')
    @Post('cis/schedule')
    async scheduleInspection(@Body() body: {
        unitId: number;
        inspectionType: 'SINGLE' | 'JOINT';
        departmentIds: number[];
        inspectorAssignments?: Record<number, string>;
        scheduledDate: string;
        comments?: string;
    }, @Req() req: any) {
        const userId = BigInt(req.user?.id || '1');
        console.log('Received Schedule Request:', JSON.stringify(body, null, 2));
        return this.inspectionsService.scheduleInspection({
            ...body,
            scheduledDate: new Date(body.scheduledDate),
            allocatedBy: userId,
        });
    }

    @Resource('MASTER_ALL')
    @Post('cis/reschedule')
    async rescheduleInspection(@Body() body: {
        inspectionId: string;
        newDate: string;
        reason?: string;
    }, @Req() req: any) {
        const userId = BigInt(req.user?.id || '1');
        return this.inspectionsService.rescheduleInspection(
            body.inspectionId,
            new Date(body.newDate),
            userId
        );
    }

    @Resource('INSPECTOR_DASHBOARD')
    @Post('inspector/request-reschedule')
    async requestReschedule(@Body() body: {
        inspectionId: string;
        reason: string;
    }, @Req() req: any) {
        const userId = BigInt(req.user?.id || '1');
        return this.inspectionsService.requestReschedule(
            body.inspectionId,
            body.reason,
            userId
        );
    }

    @Resource('INSPECTOR_DASHBOARD')
    @Get('cis/inspection/:id')
    async getInspectorInspectionDetail(@Param('id') id: string) {
        return this.inspectionsService.getCISInspectionDetail(id);
    }

    // ===================================
    // INSPECTOR DASHBOARD
    // ===================================

    @Resource('INSPECTOR_DASHBOARD')
    @Get('inspector/dashboard')
    async getInspectorDashboard(@Req() req: any, @Query('status') status?: string) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.getInspectorDashboard(userId, status);
    }

    @Resource('INSPECTOR_DASHBOARD')
    @Post('inspector/submit-report')
    async submitInspectionReport(
        @Body() body: {
            inspectionId: string;
            responses: any[];
            observations: any[];
            evidence: any[];
            startedAt?: string;
            completedAt?: string;
            comments?: string;
        },
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.submitInspectionReport(userId, body);
    }

    @Resource('INSPECTOR_DASHBOARD')
    @Post('inspector/generate-observations')
    async generateSmartObservations(
        @Body() body: {
            inspectionId: string;
            responses: Array<{
                checklistItemId: number;
                response: string;
                remarks?: string;
                question?: string;
            }>;
        },
        @Req() req: any
    ) {
        return this.inspectionsService.generateSmartObservations(
            body.inspectionId,
            body.responses
        );
    }

    @Resource('INSPECTOR_DASHBOARD')
    @Post('inspector/generate-recommendation')
    async generateSmartRecommendation(
        @Body() body: {
            inspectionId: string;
            unitName?: string;
            responses: Array<{
                checklistItemId: number;
                response: string;
                remarks?: string;
                question?: string;
            }>;
        },
    ) {
        return this.inspectionsService.generateSmartRecommendation(
            body.inspectionId,
            body.responses,
            body.unitName
        );
    }

    @Resource('INSPECTOR_DASHBOARD')
    @Post('inspector/transactions/:id/evidence')
    async uploadInspectorEvidence(
        @Param('id') inspectionId: string,
        @Body() data: {
            checklistItemId?: number;
            fileType: string;
            fileUrl: string;
            fileName?: string;
            fileSize?: number;
            geoTag?: { lat: number; lng: number };
        },
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        const uploaderRole = 'DEPARTMENT_OFFICIAL'; // Explicitly set role for inspector uploads
        return this.inspectionsService.uploadEvidence(inspectionId, data, userId, uploaderRole);
    }

    @Resource('INSPECTOR_DASHBOARD')
    @Delete('inspector/transactions/:id/evidence')
    async deleteInspectorEvidence(
        @Param('id') inspectionId: string,
        @Query('fileUrl') fileUrl: string,
        @Req() req: any
    ) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.deleteEvidence(inspectionId, fileUrl, userId);
    }

    @Resource('MASTER_ALL')
    @Get('cis/inspectors/:id/schedule')
    @Get('cis/inspectors/:id/schedule')
    getInspectorSchedule(@Param('id') id: string) {
        return this.inspectionsService.getInspectorSchedule(id);
    }

    @Resource('INVESTOR_DASHBOARD')
    @Post('investor/ai/chat')
    async chatWithAi(@Body() chatDto: ChatDto, @Req() req: any) {
        const userId = req.user?.id || '1';
        return this.inspectionsService.chatWithAi(userId, chatDto.message, chatDto.history, chatDto.context);
    }

    // ===================================
    // ADVANCED AI PDF GENERATOR
    // ===================================

    @Resource('MASTER_ALL')
    @Post('cis/generate-checklist-from-pdf')
    @UseInterceptors(FileInterceptor('file'))
    async generateChecklistFromPdf(
        @UploadedFile() file: Express.Multer.File,
        @Body('steeringInstructions') steeringInstructions?: string
    ) {
        if (!file) {
            throw new Error('No PDF file provided');
        }
        
        // Pass the raw buffer directly to Gemini for multimodal vision
        const generatedItems = await this.aiService.generateEnterpriseChecklist(
            file.buffer, 
            file.mimetype, 
            steeringInstructions
        );
        
        return { items: generatedItems };
    }
}

