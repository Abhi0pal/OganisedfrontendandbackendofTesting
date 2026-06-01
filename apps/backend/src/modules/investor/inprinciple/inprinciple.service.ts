import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { PrismaService } from '../../database/prisma.service';
import { InprincipleHistoryService } from './history/inprinciple-history.service';
import { InprincipleDraftService } from './draft/inprinciple-draft.service';
import { InprinciplePaymentService } from './payment/inprinciple-payment.service';

@Injectable()
export class InprincipleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyService: InprincipleHistoryService,
    private readonly draftService: InprincipleDraftService,
    private readonly paymentService: InprinciplePaymentService,
  ) {}

  // Draft edit URL.
  private buildRevertedCallbackUrl(
    serviceId: string,
    submissionId: number,
    departmentId?: number,
  ) {
    const params = new URLSearchParams();
    params.set('submissionId', String(submissionId));
    params.set('mode', 'edit');
    params.set('serviceId', String(serviceId));
    if (departmentId) params.set('departmentId', String(departmentId));
    return `/investor/inprinciple/new?${params.toString()}`;
  }

  // Application print URL.
  private buildPrintAppUrl(submissionId: number) {
    return `/investor/inprinciple/print?submissionId=${submissionId}`;
  }

  // Format for UI display.
  private formatLabel(value: any) {
    if (!value) return 'N/A';
    const text = String(value).trim();
    if (!text) return 'N/A';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // List investor applications for dashboard accordion.
  async getInvestorApplications(options: {
    userId: bigint;
    serviceId?: string;
  }) {
    const where: any = { userId: options.userId };
    if (options.serviceId) {
      where.serviceId = String(options.serviceId);
    }

    const submissions = await this.prisma.applicationSubmission.findMany({
      where,
      orderBy: { submissionId: 'desc' },
    });

    const appIds = submissions.map((item) => BigInt(item.submissionId));
    const spApps = appIds.length
      ? await this.prisma.spApplication.findMany({
          where: { appId: { in: appIds } },
        })
      : [];
    const spMap = new Map<string, any>(
      spApps.map((item) => [String(item.appId), item]),
    );

    return submissions.map((submission) => {
      const formData = submission.fieldValue as any;
      const projectTypeRaw = formData?.company?.primary_activity;
      const proposalTypeRaw = formData?.company?.proposal_type;
      const projectType =
        projectTypeRaw === 'manufacturing'
          ? 'Manufacturing'
          : projectTypeRaw === 'service'
            ? 'Service'
            : this.formatLabel(projectTypeRaw);
      const proposalType = this.formatLabel(proposalTypeRaw);

      const projectCategory = this.formatLabel(
        formData?.finance?.project_category,
      );
      const investmentValue =
        formData?.finance?.cost?.plant || formData?.finance?.cost?.total;
      const investment = investmentValue ? String(investmentValue) : 'N/A';
      const pollutionCategory = this.formatLabel(
        formData?.requirement?.pollution?.category,
      );
      const spApp = spMap.get(String(submission.submissionId));
      const fallbackRevertUrl = this.buildRevertedCallbackUrl(
        submission.serviceId,
        submission.submissionId,
        submission.deptId || undefined,
      );
      const fallbackPrintUrl = this.buildPrintAppUrl(submission.submissionId);

      return {
        submissionId: submission.submissionId,
        status: submission.applicationStatus,
        ubuId: submission.ubuId || null,
        unitName: submission.unitName || '',
        projectCategory,
        projectType,
        proposalType,
        investment,
        pollutionCategory,
        revertedCallBackUrl: spApp?.revertedCallBackUrl || fallbackRevertUrl,
        printAppCallBackUrl: spApp?.printAppCallBackUrl || fallbackPrintUrl,
        downloadCertificateCallBackUrl:
          spApp?.downloadCertificateCallBackUrl || null,
      };
    });
  }

  async getCafOptions(userId: bigint) {
    const submissions = await this.prisma.applicationSubmission.findMany({
      where: { userId },
      select: { submissionId: true, unitName: true },
      orderBy: { submissionId: 'desc' },
    });

    return submissions.map((submission) => ({
      id: submission.submissionId,
      unitName: submission.unitName || '',
      label: `${submission.unitName || 'CAF'} - ${submission.submissionId}`,
    }));
  }

  // Load a saved draft for editing.
  async getDraftApplication(options: { submissionId: number; userId: bigint }) {
    return this.draftService.getDraftApplication(options);
  }

  // List approved SB (CAF) submissions for existing investor flows.
  async getApprovedSbList(options: { userId: bigint; serviceId?: string }) {
    const submissions = await this.prisma.applicationSubmission.findMany({
      where: {
        userId: options.userId,
        applicationStatus: 'A',
        parentSubId: 0,
        ...(options.serviceId ? { serviceId: options.serviceId } : {}),
      },
      orderBy: { submissionId: 'desc' },
      select: {
        submissionId: true,
        ubuId: true,
        unitName: true,
        serviceId: true,
      },
    });

    return submissions
      .filter((item) => item.ubuId)
      .map((item) => ({
        submissionId: item.submissionId,
        ubuId: item.ubuId,
        unitName: item.unitName || '',
        serviceId: item.serviceId,
      }));
  }

  // Load an approved SB (CAF) submission for prefilling.
  async getApprovedSbSubmission(options: {
    userId: bigint;
    submissionId: number;
  }) {
    const submission = await this.prisma.applicationSubmission.findFirst({
      where: {
        submissionId: options.submissionId,
        userId: options.userId,
        applicationStatus: 'A',
        parentSubId: 0,
      },
      select: {
        submissionId: true,
        serviceId: true,
        deptId: true,
        fieldValue: true,
        unitName: true,
        ubuId: true,
      },
    });

    if (!submission) {
      throw new BadRequestException('Approved SB application not found');
    }

    return submission;
  }

  // Load application for view/print (read-only).
  async getApplicationView(options: { submissionId: number; userId: bigint }) {
    return this.draftService.getApplicationView(options);
  }

  // Fetch application history for activity log.
  async getApplicationHistory(options: {
    submissionId: number;
    userId: bigint;
  }) {
    return this.historyService.getApplicationHistory(options);
  }

  // Document checklist from service mapping.
  async getDocumentChecklist(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
    });

    if (!service?.document_checklist_mapping) {
      return [];
    }

    const mapping = Array.isArray(service.document_checklist_mapping)
      ? service.document_checklist_mapping
      : typeof service.document_checklist_mapping === 'string'
        ? JSON.parse(service.document_checklist_mapping)
        : [];

    const docIds = mapping
      .map((item: any) =>
        Number(
          item.doc_id ??
            item.docId ??
            item.document_id ??
            item.documentId ??
            item.id ??
            item.master_id ??
            item.documentMasterId,
        ),
      )
      .filter((id: number) => Number.isFinite(id));

    if (!docIds.length) return [];

    const masters = await this.prisma.documentMaster.findMany({
      where: { id: { in: docIds } },
      include: {
        documentType: true,
        department: true,
      },
    });

    const masterMap = new Map<number, any>(
      masters.map((item) => [item.id, item]),
    );

    return mapping
      .map((item: any) => {
        const id = Number(
          item.doc_id ??
            item.docId ??
            item.document_id ??
            item.documentId ??
            item.id ??
            item.master_id ??
            item.documentMasterId,
        );
        const master = masterMap.get(id);
        if (!master) return null;
        return {
          id: master.id,
          checklistId: master.checklistId,
          name: master.checklistDocumentName,
          extension: master.checklistDocumentExtension,
          maxSize: master.checklistDocumentMaxSize,
          documentType: master.documentType?.name || null,
          departmentId: master.departmentId,
          isRequired: item.is_required,
          comment: item.doc_comment || '',
          isMultiVersionAllowed: !!master.isMultiVersionAllowed,
          isDocValidityRequired: !!master.isDocValidityRequired,
        };
      })
      .filter(Boolean);
  }

  async getUploadedDocuments(submissionId: number, userId: bigint) {
    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { submissionId: true, serviceId: true },
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const checklist = await this.getDocumentChecklist(
      String(submission.serviceId),
    );
    const checklistIds = checklist
      .map((item: any) => Number(item.id))
      .filter(Number.isFinite);

    const investorDocs = await this.prisma.investorDocument.findMany({
      where: {
        investorProfileUid: investorProfile.uid,
        documentMasterId: { in: checklistIds },
      },
      select: {
        id: true,
        documentMasterId: true,
        documentName: true,
        documentReferenceNumber: true,
        documentVersion: true,
        documentStatus: true,
        createdAt: true,
      },
    });

    const latestByMaster = new Map<number, any>();
    for (const doc of investorDocs) {
      const existing = latestByMaster.get(doc.documentMasterId);
      if (!existing) {
        latestByMaster.set(doc.documentMasterId, doc);
        continue;
      }
      const currentParts = this.getVersionParts(doc.documentVersion);
      const existingParts = this.getVersionParts(existing.documentVersion);
      if (
        currentParts.major > existingParts.major ||
        (currentParts.major === existingParts.major &&
          currentParts.minor > existingParts.minor)
      ) {
        latestByMaster.set(doc.documentMasterId, doc);
      } else if (
        currentParts.major === existingParts.major &&
        currentParts.minor === existingParts.minor &&
        doc.createdAt &&
        existing.createdAt &&
        doc.createdAt > existing.createdAt
      ) {
        latestByMaster.set(doc.documentMasterId, doc);
      }
    }

    const docs: Array<{
      documentMasterId: number;
      documentsId: number;
      checklistId: string | null;
      fileName: string;
      filePath: string;
      status: string;
      createdOn: Date;
      versionType: string;
      version: string;
    }> = [];

    for (const investorDoc of latestByMaster.values()) {
      const filePath = `uploads/investorDocuments/${investorProfile.uid}/${investorDoc.documentName}`;
      const versionType = String(investorDoc.documentVersion || '').startsWith(
        'D',
      )
        ? 'D'
        : 'V';
      const version = String(investorDoc.documentVersion || '').substring(1);
      docs.push({
        documentMasterId: investorDoc.documentMasterId,
        documentsId: Number(investorDoc.id),
        checklistId: null,
        fileName: investorDoc.documentName,
        filePath,
        status: investorDoc.documentStatus,
        createdOn: investorDoc.createdAt,
        versionType,
        version,
      });
    }

    return { uploads: docs };
  }

  async uploadSupportingDocument(options: {
    submissionId: number;
    documentMasterId: number;
    uploadType: 'new' | 'duplicate';
    comments?: string;
    validFrom?: string;
    validTo?: string;
    docDateOfIssuance?: string;
    isDocumentActive?: string;
    filePath: string;
    fileName: string;
    originalName: string;
    userId: bigint;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      submissionId,
      documentMasterId,
      uploadType,
      comments,
      validFrom,
      validTo,
      docDateOfIssuance,
      isDocumentActive,
      filePath,
      fileName,
      originalName,
      userId,
      ipAddress,
      userAgent,
    } = options;

    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: {
        submissionId: true,
        deptId: true,
        serviceId: true,
        processingLevel: true,
      },
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(submissionId) },
      select: { sno: true, appStatus: true },
    });
    if (!spApp?.sno) {
      throw new BadRequestException('Application not found in sp applications');
    }

    const allowedStatuses = ['I', 'RBI', 'H', 'DP', 'PD'];
    if (spApp.appStatus && !allowedStatuses.includes(spApp.appStatus)) {
      throw new BadRequestException(
        'Document upload is not allowed for this application status',
      );
    }

    const master = await this.prisma.documentMaster.findUnique({
      where: { id: documentMasterId },
      select: {
        id: true,
        checklistId: true,
        checklistDocumentExtension: true,
        documentTypeId: true,
        issuerId: true,
        departmentId: true,
        isMultiVersionAllowed: true,
        isDocValidityRequired: true,
      },
    });
    if (!master?.checklistId) {
      throw new BadRequestException('Document Master not found');
    }
    if (!master.documentTypeId || !master.departmentId || !master.issuerId) {
      throw new BadRequestException(
        'Document Master is missing required mappings',
      );
    }

    const checklistId = master.checklistId;
    const versionType = uploadType === 'duplicate' ? 'D' : 'V';

    if (master.isDocValidityRequired) {
      if (!validFrom || !validTo) {
        throw new BadRequestException(
          'Valid From and Valid To are required for this document',
        );
      }
    }

    if (!master.isMultiVersionAllowed) {
      const existingSingle = await this.prisma.investorDocument.findFirst({
        where: {
          investorProfileUid: investorProfile.uid,
          documentMasterId: master.id,
        },
        select: { id: true },
      });
      if (existingSingle) {
        throw new BadRequestException(
          'Multiple versions are not allowed for this document',
        );
      }
    }

    const allowedExtensions = String(master.checklistDocumentExtension || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const incomingExt = originalName.includes('.')
      ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
      : '';
    if (allowedExtensions.length && !allowedExtensions.includes(incomingExt)) {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
      }
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
      );
    }

    const existing = await this.prisma.investorDocument.findMany({
      where: {
        investorProfileUid: investorProfile.uid,
        documentMasterId: master.id,
        documentVersion: { startsWith: versionType },
      },
      orderBy: { createdAt: 'desc' },
      select: { documentVersion: true },
    });

    const version = this.getNextDocVersion(existing);
    const versionLabel = `${versionType}${version}`;

    const ext = incomingExt ? `.${incomingExt}` : '';
    const docRefNumber = `${investorProfile.uid}_${checklistId}_${versionLabel}`;
    const documentName = `${docRefNumber}${ext}`;
    const relativePath = `uploads/investorDocuments/${investorProfile.uid}/${documentName}`;

    const issuerId =
      submission.processingLevel &&
      String(submission.processingLevel).toLowerCase() === 'state'
        ? 2
        : 1;

    const created = await this.prisma.investorDocument.create({
      data: {
        documentMasterId: master.id,
        documentTypeId: master.documentTypeId,
        issuerId,
        departmentId: submission.deptId ?? master.departmentId,
        investorProfileUid: investorProfile.uid,
        userId: BigInt(userId),
        documentReferenceNumber: docRefNumber,
        documentName,
        documentVersion: versionLabel,
        documentStatus: 'U',
        isDocumentActive: (isDocumentActive as any) || 'Y',
        documentPath: relativePath,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        documentDateOfIssuance: docDateOfIssuance
          ? new Date(docDateOfIssuance)
          : null,
        comments: comments || null,
      },
    });

    if (!Number.isSafeInteger(Number(created.id))) {
      throw new BadRequestException('Generated document id is too large');
    }

    return {
      documentsId: Number(created.id),
      checklistId,
      documentName,
      filePath: relativePath,
      docRefNumber,
      versionType,
      version,
    };
  }

  private getChecklistNumericId(checklistId?: string | null) {
    if (!checklistId) return null;
    const parts = String(checklistId).split('-');
    const last = parts[parts.length - 1];
    const num = Number(last);
    return Number.isFinite(num) ? num : null;
  }

  private getChecklistIdFromNumericId(docchkId?: number | null) {
    if (!docchkId) return null;
    return `UK-DCL-${docchkId}`;
  }

  private getNextDocVersion(existing: { documentVersion?: string | null }[]) {
    if (!existing.length) return '1.0';
    const latestRaw = String(existing[0].documentVersion || '1.0');
    const latest = latestRaw.replace(/^[A-Za-z]+/, '');
    const [majorRaw, minorRaw] = latest.split('.');
    const major = Number(majorRaw);
    const minor = Number(minorRaw);
    if (Number.isNaN(major) || Number.isNaN(minor)) return '1.0';
    return minor < 10 ? `${major}.${minor + 1}` : `${major + 1}.0`;
  }

  private getVersionParts(version?: string | null) {
    if (!version) return { major: -1, minor: -1 };
    const cleaned = String(version).replace(/^[A-Za-z]+/, '');
    const [majorRaw, minorRaw] = cleaned.split('.');
    const major = Number(majorRaw);
    const minor = Number(minorRaw);
    if (Number.isNaN(major) || Number.isNaN(minor)) {
      return { major: -1, minor: -1 };
    }
    return { major, minor };
  }

  async getPaymentDetails(submissionId: number, userId: bigint) {
    return this.paymentService.getPaymentDetails(submissionId, userId);
  }

  async createPayment(options: {
    submissionId: number;
    userId: bigint;
    amount: number;
    paymentMode: string;
  }) {
    return this.paymentService.createPayment(options);
  }

  async updatePaymentStatus(options: {
    paymentId: number;
    userId: bigint;
    statusCode: 'S' | 'F';
  }) {
    return this.paymentService.updatePaymentStatus(options);
  }

  // Create a new draft (status I).
  async submitDraftApplication(options: {
    userId: bigint;
    serviceId: string;
    departmentId?: number;
    formTypeId?: number;
    processingLevel?: string;
    formData: any;
    unitName?: string;
    districtId: number;
    cafType?: string;
    parentSubId?: number;
    cafId?: number;
    existingUbuId?: string;
    revertedCallBackUrl?: string;
    printAppCallBackUrl?: string;
    downloadCertificateCallBackUrl?: string;
    currentStep?: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.draftService.submitDraftApplication(options);
  }

  // Update an existing draft (status I).
  async updateDraftApplication(options: {
    submissionId: number;
    userId: bigint;
    serviceId: string;
    departmentId?: number;
    formTypeId?: number;
    processingLevel?: string;
    formData: any;
    unitName?: string;
    districtId: number;
    cafType?: string;
    existingUbuId?: string;
    revertedCallBackUrl?: string;
    printAppCallBackUrl?: string;
    downloadCertificateCallBackUrl?: string;
    currentStep?: number;
    isFinalSubmit?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.draftService.updateDraftApplication(options);
  }
}
