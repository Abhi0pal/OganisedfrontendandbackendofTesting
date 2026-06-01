import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { InprinciplePaymentService } from '../payment/inprinciple-payment.service';
import { WorkflowRuntimeService } from '../../../workflow-runtime/workflow-runtime.service';

@Injectable()
export class InprincipleDraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: InprinciplePaymentService,
    private readonly workflowRuntimeService: WorkflowRuntimeService,
  ) {}

  private async resolveActorInfo(userId: bigint) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        department_user: { select: { full_name: true } },
        investor_profile: { select: { first_name: true, last_name: true } },
        role: { select: { name: true } },
      },
    });
    const investorNameParts = [
      user?.investor_profile?.first_name,
      user?.investor_profile?.last_name,
    ].filter((part) => !!part);
    const investorDisplayName = investorNameParts.join(' ').trim();
    const displayName =
      user?.department_user?.full_name || investorDisplayName || 'Investor';
    const roleName = user?.role?.name || 'Investor';
    return { displayName, roleName };
  }

  // BUSINESS RULE: SB ID (UBU ID) can be generated only when PAN + state_code + district_id exist.
  // We keep the existing UBU format for backward compatibility and only tighten input gating.
  private buildUbuId(formData: any, districtId: number) {
    const pan = String(formData?.company?.pan || '').trim();
    const stateCode = String(
      formData?.company?.state_code ||
        formData?.company?.corp?.state_code ||
        formData?.company?.corp?.state ||
        '',
    ).trim();
    const activity = String(formData?.company?.primary_activity || '').trim();
    const activityInitial = activity ? activity.charAt(0).toUpperCase() : '';
    const district = districtId ? String(districtId) : '';
    if (!pan || !stateCode || !district || !activityInitial) return null;
    return `${pan}UK${district}${activityInitial}`;
  }

  // BUSINESS RULE: generate SB ID only during Step 4 save or final submit.
  private shouldGenerateUbuId(stepIndex?: number, isFinalSubmit?: boolean) {
    if (isFinalSubmit) return true;
    return Number(stepIndex) === 4;
  }

  // Build app location from land details or corporate address.
  private buildAppLocation(formData: any) {
    const land = formData?.requirement?.land || {};
    const parts = [
      land.land_code,
      land.survey_no,
      land.village,
      land.block,
      land.district,
    ]
      .map((item: any) => String(item || '').trim())
      .filter(Boolean);

    if (parts.length) {
      return parts.join(', ');
    }

    const corp = formData?.company?.corp || {};
    return [corp.address1, corp.city, corp.block, corp.district]
      .map((item: any) => String(item || '').trim())
      .filter(Boolean)
      .join(', ');
  }

  // Prefer land district for master district mapping.
  private resolveMasterDistrictId(formData: any, fallbackDistrictId: number) {
    const landDistrict = Number(formData?.requirement?.land?.district || 0);
    return landDistrict || fallbackDistrictId;
  }

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

  // Deep merge while keeping latest __currentStep and non-empty values.
  private mergeDeep(base: any, override: any) {
    if (Array.isArray(base) || Array.isArray(override)) {
      return override ?? base;
    }
    if (
      base &&
      typeof base === 'object' &&
      override &&
      typeof override === 'object'
    ) {
      const result: Record<string, any> = { ...base };
      Object.keys(override).forEach((key) => {
        if (key === '__currentStep') {
          const nextStep = Number(override[key]);
          const prevStep = Number(base?.[key]);
          if (Number.isFinite(nextStep)) {
            result[key] = nextStep;
          } else if (Number.isFinite(prevStep)) {
            result[key] = prevStep;
          }
          return;
        }
        result[key] = this.mergeDeep(base?.[key], override[key]);
      });
      return result;
    }
    if (override === '' || override === null || override === undefined) {
      return base ?? override;
    }
    return override ?? base;
  }

  // Normalize form data before saving.
  private sanitizeFormData(formData: any) {
    const normalized = this.mergeDeep({}, formData || {});

    if (normalized.project) {
      if (!Array.isArray(normalized.project.capacity_items)) {
        normalized.project.capacity_items = [];
      }
      if (!Array.isArray(normalized.project.product_items)) {
        normalized.project.product_items = [];
      }

      if (normalized.project.capacity_items.length > 0) {
        delete normalized.project.activity_nic;
        delete normalized.project.sector;
        delete normalized.project.item_description;
        delete normalized.project.proposed_capacity;
        delete normalized.project.unit_type;
      }
      if (normalized.project.product_items.length > 0) {
        delete normalized.project.product_annual_capacity;
        delete normalized.project.product_unit;
        delete normalized.project.product_hsn;
        delete normalized.project.product_description;
      }
    }

    if (normalized.promoter) {
      if (!Array.isArray(normalized.promoter.entries)) {
        normalized.promoter.entries = [];
      }
      normalized.promoter.entries = normalized.promoter.entries.map(
        (entry: any) => {
          if (entry && typeof entry === 'object' && 'entries' in entry) {
            const next = { ...entry };
            delete next.entries;
            return next;
          }
          return entry;
        },
      );

      if (normalized.promoter.entries.length > 0) {
        Object.keys(normalized.promoter).forEach((key) => {
          if (key === 'entries') return;
          const value = normalized.promoter[key];
          if (
            value === '' ||
            value === null ||
            value === undefined ||
            value === false
          ) {
            delete normalized.promoter[key];
          }
        });
      }
    }

    if (normalized.requirement?.water) {
      if (!Array.isArray(normalized.requirement.water.details)) {
        normalized.requirement.water.details = [];
      }
    }

    if (normalized.__currentStep !== undefined) {
      const step = Number(normalized.__currentStep);
      normalized.__currentStep = Number.isFinite(step) ? step : 0;
    }
    return normalized;
  }

  // Application print URL.
  private buildPrintAppUrl(submissionId: number) {
    return `/investor/inprinciple/print?submissionId=${submissionId}`;
  }

  private getStatusForStep(stepIndex?: number) {
    const step = Number(stepIndex);
    if (step === 4) return 'DP';
    if (step === 5) return 'PD';
    if (step >= 6) return 'I';
    return 'I';
  }

  private buildHistoryComment(status: string, stepIndex?: number) {
    if (status === 'DP') return 'Documents pending';
    if (status === 'PD') return 'Payment pending';
    if (status === 'P') return 'Application submitted by investor';
    const step = Number(stepIndex);
    if (Number.isFinite(step) && step >= 0) {
      return `Draft saved at Step ${step + 1}`;
    }
    return 'Application saved in draft';
  }

  private async shouldLogHistory(
    appId: number,
    serviceId: string,
    status: string,
  ) {
    const last = await this.prisma.applicationHistory.findFirst({
      where: { appId: String(appId), serviceId },
      orderBy: { addedDateTime: 'desc' },
      select: { applicationStatus: true },
    });
    if (!last?.applicationStatus) return true;
    return String(last.applicationStatus) !== String(status);
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

  private normalizeWorkflowActionKey(value: string) {
    const raw = String(value || '').trim().toUpperCase();
    if (raw === 'FORWARD') return 'F';
    if (raw === 'APPROVE') return 'A';
    if (raw === 'REJECT') return 'R';
    if (raw === 'REVERT_TO_INVESTOR') return 'RBI';
    if (raw === 'FORWARD_TO_APPROVER') return 'FA';
    if (raw === 'F') return 'F';
    if (raw === 'A') return 'A';
    if (raw === 'R') return 'R';
    if (raw === 'RBI') return 'RBI';
    if (raw === 'FA') return 'FA';
    return raw;
  }

  private async syncDocumentMappings(options: {
    submissionId: number;
    userId: bigint;
    serviceId: string;
    deptId: number;
    ipAddress?: string | null;
    userAgent?: string | null;
    prisma?: PrismaService | Prisma.TransactionClient;
  }) {
    const prisma = options.prisma || this.prisma;

    const service = await prisma.service.findFirst({
      where: { service_id: options.serviceId },
      select: { document_checklist_mapping: true },
    });
    if (!service?.document_checklist_mapping) return;

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

    if (!docIds.length) return;

    const investorProfile = await prisma.investor_profiles.findUnique({
      where: { user_id: options.userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) return;

    const spApp = await prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { sno: true },
    });
    const resolvedSno = spApp?.sno ? BigInt(spApp.sno) : BigInt(options.submissionId);

    const existingMappings =
      await prisma.applicationDmsDocumentsMapping.findMany({
        where: {
          sno: resolvedSno,
          userId: BigInt(options.userId),
          serviceId: options.serviceId,
        },
        select: { documentsId: true },
      });
    const mappedDocumentIds = new Set(
      existingMappings
        .map((item) => Number(item.documentsId))
        .filter(Number.isFinite),
    );

    const investorDocs = await prisma.investorDocument.findMany({
      where: {
        investorProfileUid: investorProfile.uid,
        documentMasterId: { in: docIds },
      },
      select: {
        id: true,
        documentMasterId: true,
        documentName: true,
        documentVersion: true,
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

    for (const doc of latestByMaster.values()) {
      const docId = Number(doc.id);
      if (!Number.isSafeInteger(docId)) continue;
      if (mappedDocumentIds.has(docId)) continue;

      await prisma.applicationDmsDocumentsMapping.create({
        data: {
          iuid: BigInt(investorProfile.uid),
          userId: BigInt(options.userId),
          sno: resolvedSno,
          serviceId: options.serviceId,
          deptId: options.deptId ?? 0,
          documentsId: docId,
          documentFileName: doc.documentName,
          status: 'U',
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null,
          createdOn: new Date(),
          lastUpdated: null,
          comments: null,
          isUploadedFlag: 1,
        },
      });
    }
  }

  private async assertMandatoryDocumentsCompliant(options: {
    serviceId: string;
    userId: bigint;
    prisma?: PrismaService | Prisma.TransactionClient;
  }) {
    const prisma = options.prisma || this.prisma;
    const service = await prisma.service.findFirst({
      where: { service_id: options.serviceId },
      select: { document_checklist_mapping: true },
    });
    if (!service?.document_checklist_mapping) return;

    const mapping = Array.isArray(service.document_checklist_mapping)
      ? service.document_checklist_mapping
      : typeof service.document_checklist_mapping === 'string'
        ? JSON.parse(service.document_checklist_mapping)
        : [];

    const requiredDocIds = mapping
      .filter((item: any) => {
        const raw = item?.is_required ?? item?.isRequired ?? 'N';
        if (raw === true || raw === 1) return true;
        const normalized = String(raw).trim().toUpperCase();
        return ['Y', 'YES', 'TRUE', '1'].includes(normalized);
      })
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
      .filter((id: number) => Number.isFinite(id) && id > 0);
    if (!requiredDocIds.length) return;

    const investorProfile = await prisma.investor_profiles.findUnique({
      where: { user_id: options.userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    const investorDocs = await prisma.investorDocument.findMany({
      where: {
        investorProfileUid: investorProfile.uid,
        documentMasterId: { in: requiredDocIds },
      },
      select: {
        documentMasterId: true,
        documentStatus: true,
        documentVersion: true,
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

    const missingDocIds = requiredDocIds.filter(
      (docId) => !latestByMaster.has(docId),
    );
    const rejectedDocIds = requiredDocIds.filter((docId) => {
      const latest = latestByMaster.get(docId);
      const status = String(latest?.documentStatus || '').toUpperCase();
      return status === 'R';
    });

    if (!missingDocIds.length && !rejectedDocIds.length) return;

    const allFailedIds = Array.from(
      new Set([...missingDocIds, ...rejectedDocIds]),
    );
    const masters = await prisma.documentMaster.findMany({
      where: { id: { in: allFailedIds } },
      select: { id: true, checklistDocumentName: true },
    });
    const nameById = new Map(
      masters.map((item) => [item.id, item.checklistDocumentName || `Document ${item.id}`]),
    );
    const missingNames = missingDocIds.map(
      (id) => nameById.get(id) || `Document ${id}`,
    );
    const rejectedNames = rejectedDocIds.map(
      (id) => nameById.get(id) || `Document ${id}`,
    );
    const parts: string[] = [];
    if (missingNames.length) {
      parts.push(`Missing mandatory documents: ${missingNames.join(', ')}`);
    }
    if (rejectedNames.length) {
      parts.push(
        `Rejected mandatory documents require new upload: ${rejectedNames.join(', ')}`,
      );
    }
    throw new BadRequestException(parts.join('. '));
  }

  async getDraftApplication(options: { submissionId: number; userId: bigint }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    if (submission.userId !== options.userId) {
      throw new BadRequestException('Unauthorized draft access');
    }

    const allowedStatuses = ['I', 'DP', 'PD', 'RBI'];
    if (!allowedStatuses.includes(String(submission.applicationStatus || ''))) {
      throw new BadRequestException(
        'Application is not editable in current status',
      );
    }

    return {
      submissionId: submission.submissionId,
      status: submission.applicationStatus,
      formData: submission.fieldValue || {},
      unitName: submission.unitName || '',
      serviceId: submission.serviceId,
      departmentId: submission.deptId || null,
      formTypeId: submission.formId || null,
      ubuId: submission.ubuId || null,
      applicationCreatedDate: submission.applicationCreatedDate || null,
      applicationUpdatedDateTime: submission.applicationUpdatedDateTime || null,
    };
  }

  async getApplicationView(options: { submissionId: number; userId: bigint }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    if (submission.userId !== options.userId) {
      throw new BadRequestException('Unauthorized access');
    }

    return {
      submissionId: submission.submissionId,
      status: submission.applicationStatus,
      formData: submission.fieldValue || {},
      unitName: submission.unitName || '',
      serviceId: submission.serviceId,
      departmentId: submission.deptId || null,
      formTypeId: submission.formId || null,
      ubuId: submission.ubuId || null,
    };
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
    if ((options.currentStep ?? 0) === 0) {
      const corp = options.formData?.company?.corp || {};
      const required = [
        {
          label: 'Date of Incorporation',
          value: options.formData?.company?.incorporation_date,
        },
        { label: 'City', value: corp.city },
        { label: 'Address Line 1', value: corp.address1 },
        { label: 'Pin Code', value: corp.pincode },
        { label: 'Email ID', value: corp.email },
        { label: 'Country Code', value: corp.country_code },
        { label: 'Mobile Number', value: corp.mobile },
      ];
      const missing = required.filter(
        (item) => !item.value || String(item.value).trim() === '',
      );
      if (missing.length) {
        throw new BadRequestException(
          `Missing required fields: ${missing.map((item) => item.label).join(', ')}`,
        );
      }
    }

    const service = await this.prisma.service.findFirst({
      where: { service_id: options.serviceId },
    });
    const resolvedDepartmentId =
      options.departmentId || service?.department_id || 0;
    const department = resolvedDepartmentId
      ? await this.prisma.department.findUnique({
          where: { id: resolvedDepartmentId },
        })
      : null;
    const district = await this.prisma.district.findUnique({
      where: { id: options.districtId },
    });

    const spTag =
      department?.uniqueTag ||
      (options.serviceId === '943.0' ? 'DOI@908#123' : '');
    const spAppId = service?.swcs_service_id
      ? String(service.swcs_service_id)
      : options.serviceId;
    const sanitizedFormData = this.sanitizeFormData(options.formData);
    const masterDistrictId = this.resolveMasterDistrictId(
      sanitizedFormData,
      options.districtId,
    );
    const draftStatus = this.getStatusForStep(options.currentStep);
    // BUSINESS RULE: never generate/copy SB ID on draft create.
    const resolvedUbuId = null;

    const submission = await this.prisma.applicationSubmission.create({
      data: {
        parentSubId: options.parentSubId || 0,
        serviceId: options.serviceId,
        deptId: resolvedDepartmentId,
        userId: options.userId,
        applicationId: 12,
        formId: options.formTypeId || 1,
        approvalId: null,
        fieldValue: sanitizedFormData || {},
        unitName: options.unitName || null,
        applicationStatus: draftStatus,
        applicationCreatedDate: new Date(),
        applicationUpdatedDateTime: new Date(),
        ipAddress: options.ipAddress || '',
        userAgent: options.userAgent || '',
        processingLevel: (options.processingLevel as any) || 'District',
        landrigionId: masterDistrictId,
        allLandrigionId: masterDistrictId ? String(masterDistrictId) : null,
        unitPanno: String(sanitizedFormData?.company?.pan || ''),
        unitPannoUpdatedDate: new Date(),
        isMsmeapp2015Active: '1',
        ubuId: resolvedUbuId,
        ssoType: null,
        ssoApprovalId: null,
        submittedOn: null,
        appealId: null,
        businessEntityCode: district?.stateId ? String(district.stateId) : null,
      },
    });

    const now = new Date();
    const actorInfo = await this.resolveActorInfo(options.userId);
    const appLocation = this.buildAppLocation(sanitizedFormData);
    const revertedCallBackUrl =
      options.revertedCallBackUrl ||
      this.buildRevertedCallbackUrl(
        options.serviceId,
        submission.submissionId,
        resolvedDepartmentId,
      );
    const printAppCallBackUrl =
      options.printAppCallBackUrl ||
      this.buildPrintAppUrl(submission.submissionId);

    const spCreated = await this.prisma.spApplication.create({
      data: {
        spTag,
        spAppId,
        appId: BigInt(submission.submissionId),
        appName: service?.service_name || 'In-principle Application',
        appFields: {},
        appStatus: draftStatus,
        appComments:
          draftStatus === 'DP'
            ? 'Documents pending'
            : draftStatus === 'PD'
              ? 'Payment pending'
              : 'Application saved in draft',
        appDistt: String(masterDistrictId),
        appDisttName: '',
        appLocation,
        isAppliedByCaf: null,
        cafId: options.cafId || 0,
        cafType: options.cafType || null,
        unitName: options.unitName || '',
        revertedCallBackUrl,
        printAppCallBackUrl,
        downloadCertificateCallBackUrl:
          options.downloadCertificateCallBackUrl || '',
        userId: options.userId,
        createdOn: now,
        updatedOn: now,
        isActive: 'Y',
        remoteServer: options.ipAddress || '',
        userAgent: options.userAgent || '',
        param1: BigInt(0),
        param2: '',
        param3: '',
        param4: '',
        param5: '',
        isOfflineApplication: 'N',
        isUploadedSignedCertificate: 'N',
        deemedApproved: '0',
      },
    });

    if (draftStatus === 'PD') {
      await this.syncDocumentMappings({
        submissionId: submission.submissionId,
        userId: options.userId,
        serviceId: options.serviceId,
        deptId: resolvedDepartmentId,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      });
    }

    if (
      await this.shouldLogHistory(
        submission.submissionId,
        options.serviceId,
        draftStatus,
      )
    ) {
      await this.prisma.applicationHistory.create({
        data: {
          sno: spCreated?.sno ?? null,
          serviceId: options.serviceId,
          spTag,
          appId: String(submission.submissionId),
          applicationStatus: draftStatus,
          comments: this.buildHistoryComment(draftStatus, options.currentStep),
          approverId: null,
          approverDetails: actorInfo.displayName,
          nextApprover: null,
          addedDateTime: now,
          sentDatedTime: null,
          roleId: null,
          roleName: actorInfo.roleName,
          roleUserInfo: actorInfo.displayName,
          nextRoleId: null,
          remoteServer: options.ipAddress || '',
          userAgent: options.userAgent || '',
        },
      });
    }

    return submission;
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
    if ((options.currentStep ?? 0) === 0) {
      const corp = options.formData?.company?.corp || {};
      const required = [
        {
          label: 'Date of Incorporation',
          value: options.formData?.company?.incorporation_date,
        },
        { label: 'City', value: corp.city },
        { label: 'Address Line 1', value: corp.address1 },
        { label: 'Pin Code', value: corp.pincode },
        { label: 'Email ID', value: corp.email },
        { label: 'Country Code', value: corp.country_code },
        { label: 'Mobile Number', value: corp.mobile },
      ];
      const missing = required.filter(
        (item) => !item.value || String(item.value).trim() === '',
      );
      if (missing.length) {
        throw new BadRequestException(
          `Missing required fields: ${missing.map((item) => item.label).join(', ')}`,
        );
      }
    }

    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    if (submission.userId !== options.userId) {
      throw new BadRequestException('Unauthorized draft access');
    }

    const now = new Date();
    const actorInfo = await this.resolveActorInfo(options.userId);

    const service = await this.prisma.service.findFirst({
      where: { service_id: options.serviceId },
    });
    const resolvedDepartmentId =
      options.departmentId || service?.department_id || submission.deptId || 0;
    const department = resolvedDepartmentId
      ? await this.prisma.department.findUnique({
          where: { id: resolvedDepartmentId },
        })
      : null;

    const spTag =
      department?.uniqueTag ||
      (options.serviceId === '943.0' ? 'DOI@908#123' : '');
    const spAppId = service?.swcs_service_id
      ? String(service.swcs_service_id)
      : options.serviceId;
    const sanitizedFormDataUpdate = this.sanitizeFormData(options.formData);
    const masterDistrictId = this.resolveMasterDistrictId(
      sanitizedFormDataUpdate,
      options.districtId,
    );
    const appLocation = this.buildAppLocation(sanitizedFormDataUpdate);
    const revertedCallBackUrl =
      options.revertedCallBackUrl ||
      this.buildRevertedCallbackUrl(
        options.serviceId,
        options.submissionId,
        resolvedDepartmentId,
      );
    const printAppCallBackUrl =
      options.printAppCallBackUrl ||
      this.buildPrintAppUrl(options.submissionId);

    const paymentInfo =
      Number(options.currentStep) === 6
        ? await this.paymentService.getLatestSuccessfulPayment(
            options.submissionId,
            options.userId,
          )
        : null;
    const serviceIdNumber = Number(
      String(options.serviceId).split('.')[0] || 0,
    );
    const paymentParams = paymentInfo
      ? {
          param1: BigInt(serviceIdNumber || 0),
          param2: 'PayGov',
          param3: paymentInfo.created.toISOString(),
          param4: String(paymentInfo.amount),
          param5: String(paymentInfo.pgMeTrnRefNo || ''),
        }
      : {};
    const paymentSubmissionUpdate = paymentInfo
      ? { feeOfApplication: String(paymentInfo.amount) }
      : {};

    const mergedFieldValue = this.mergeDeep(
      submission.fieldValue || {},
      sanitizedFormDataUpdate || {},
    );

    const draftStatus = this.getStatusForStep(options.currentStep);
    // BUSINESS RULE: explicit reset outside Step 4/final submit; no copy from previous applications.
    const resolvedUbuId = this.shouldGenerateUbuId(
      options.currentStep,
      options.isFinalSubmit,
    )
      ? this.buildUbuId(mergedFieldValue, masterDistrictId)
      : null;

    await this.prisma.applicationSubmission.update({
      where: { submissionId: options.submissionId },
      data: {
        serviceId: options.serviceId,
        deptId: resolvedDepartmentId,
        formId: options.formTypeId ?? submission.formId ?? 1,
        fieldValue: mergedFieldValue || {},
        unitName: options.unitName || null,
        applicationStatus: draftStatus,
        applicationUpdatedDateTime: now,
        ipAddress: options.ipAddress || '',
        userAgent: options.userAgent || '',
        processingLevel:
          (options.processingLevel as any) || submission.processingLevel,
        landrigionId: masterDistrictId,
        unitPanno: String(sanitizedFormDataUpdate?.company?.pan || ''),
        unitPannoUpdatedDate: now,
        isMsmeapp2015Active: '1',
        ubuId: resolvedUbuId,
        ...paymentSubmissionUpdate,
      },
    });

    const spUpdate = await this.prisma.spApplication.updateMany({
      where: { appId: BigInt(options.submissionId) },
      data: {
        spTag,
        spAppId,
        appStatus: draftStatus,
        appComments:
          draftStatus === 'DP'
            ? 'Documents pending'
            : draftStatus === 'PD'
              ? 'Payment pending'
              : 'Application saved in draft',
        appDistt: String(masterDistrictId),
        appDisttName: '',
        appLocation,
        unitName: options.unitName || '',
        revertedCallBackUrl,
        printAppCallBackUrl,
        downloadCertificateCallBackUrl:
          options.downloadCertificateCallBackUrl || '',
        updatedOn: now,
        remoteServer: options.ipAddress || '',
        userAgent: options.userAgent || '',
        isOfflineApplication: 'N',
        isUploadedSignedCertificate: 'N',
        deemedApproved: '0',
        ...paymentParams,
      },
    });

    let spRecord = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { sno: true },
    });

    if (!spUpdate.count) {
      const spCreatedUpdate = await this.prisma.spApplication.create({
        data: {
          spTag,
          spAppId,
          appId: BigInt(options.submissionId),
          appName: service?.service_name || 'In-principle Application',
          appFields: {},
          appStatus: draftStatus,
          appComments:
            draftStatus === 'DP'
              ? 'Documents pending'
              : draftStatus === 'PD'
                ? 'Payment pending'
                : 'Application saved in draft',
          appDistt: String(options.districtId),
          appDisttName: '',
          appLocation,
          isAppliedByCaf: null,
          cafId: 0,
          cafType: null,
          unitName: options.unitName || '',
          revertedCallBackUrl,
          printAppCallBackUrl,
          downloadCertificateCallBackUrl:
            options.downloadCertificateCallBackUrl || '',
          userId: options.userId,
          createdOn: now,
          updatedOn: now,
          isActive: 'Y',
          remoteServer: options.ipAddress || '',
          userAgent: options.userAgent || '',
          param1: BigInt(0),
          param2: '',
          param3: '',
          param4: '',
          param5: '',
          isOfflineApplication: 'N',
          isUploadedSignedCertificate: 'N',
          deemedApproved: '0',
          ...paymentParams,
        },
      });
      spRecord = { sno: spCreatedUpdate.sno };
    }

    if (draftStatus === 'PD') {
      await this.syncDocumentMappings({
        submissionId: options.submissionId,
        userId: options.userId,
        serviceId: options.serviceId,
        deptId: resolvedDepartmentId,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      });
    }

    if (
      await this.shouldLogHistory(
        options.submissionId,
        options.serviceId,
        draftStatus,
      )
    ) {
      await this.prisma.applicationHistory.create({
        data: {
          sno: spRecord?.sno ?? null,
          serviceId: options.serviceId,
          spTag,
          appId: String(options.submissionId),
          applicationStatus: draftStatus,
          comments: this.buildHistoryComment(draftStatus, options.currentStep),
          approverId: null,
          approverDetails: actorInfo.displayName,
          nextApprover: null,
          addedDateTime: now,
          sentDatedTime: null,
          roleId: null,
          roleName: actorInfo.roleName,
          roleUserInfo: actorInfo.displayName,
          nextRoleId: null,
          remoteServer: options.ipAddress || '',
          userAgent: options.userAgent || '',
          ...(paymentInfo
            ? {
                param1: String(serviceIdNumber || ''),
                param2: 'PayGov',
                param3: paymentInfo.created.toISOString(),
                param4: String(paymentInfo.amount),
                param5: String(paymentInfo.pgMeTrnRefNo || ''),
              }
            : {}),
        },
      });
    }

    if (options.isFinalSubmit) {
      const submitSetup = await this.prisma.$transaction(async (tx) => {
        await this.syncDocumentMappings({
          submissionId: options.submissionId,
          userId: options.userId,
          serviceId: options.serviceId,
          deptId: resolvedDepartmentId,
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null,
          prisma: tx,
        });
        await this.assertMandatoryDocumentsCompliant({
          serviceId: options.serviceId,
          userId: options.userId,
          prisma: tx,
        });

        const user = await tx.users.findUnique({
          where: { id: options.userId },
          select: { role_id: true },
        });
        const userRoleId = Number(user?.role_id || 0);
        if (!userRoleId) {
          throw new BadRequestException('User role not found');
        }

        const latestSubmission = await tx.applicationSubmission.findUnique({
          where: { submissionId: options.submissionId },
          select: {
            workflowConfigVersion: true,
            processingLevel: true,
            applicationStatus: true,
          },
        });
        if (!latestSubmission) {
          throw new BadRequestException('Submission not found');
        }

        let workflowVersion = Number(latestSubmission.workflowConfigVersion || 0);
        if (!workflowVersion) {
          const latestPublished =
            await tx.applicationWorkflowConfiguration.findFirst({
              where: {
                serviceId: options.serviceId,
                status: 'PUBLISHED' as any,
              },
              select: { configVersion: true },
              orderBy: [{ configVersion: 'desc' }, { id: 'desc' }],
            });
          workflowVersion = Number(latestPublished?.configVersion || 0);
          if (!workflowVersion) {
            throw new BadRequestException(
              'Published workflow version not found for service',
            );
          }
          await tx.applicationSubmission.update({
            where: { submissionId: options.submissionId },
            data: { workflowConfigVersion: workflowVersion },
          });
        }

        const currentStepConfig =
          await tx.applicationWorkflowConfiguration.findFirst({
            where: {
              serviceId: options.serviceId,
              configVersion: workflowVersion,
              status: 'PUBLISHED' as any,
              currentRoleId: userRoleId,
            },
            orderBy: [{ step: 'asc' }, { id: 'asc' }],
          });

        if (!currentStepConfig) {
          throw new BadRequestException(
            'Published workflow step not found for investor role',
          );
        }

        const workflowConfig =
          await tx.applicationWorkflowConfiguration.findFirst({
            where: {
              serviceId: options.serviceId,
              configVersion: workflowVersion,
              step: currentStepConfig.step,
              currentRoleId: userRoleId,
              status: 'PUBLISHED' as any,
            },
            orderBy: { id: 'asc' },
          });

        if (!workflowConfig) {
          throw new BadRequestException(
            'Published workflow not found for investor submit step',
          );
        }

        const currentInstance = await tx.workflowInstance.findFirst({
          where: { applicationId: options.submissionId },
          orderBy: { id: 'desc' },
        });
        if (!currentInstance) {
          const slaHours = Number(workflowConfig.slaHours || 0);
          const dueAt =
            slaHours > 0
              ? new Date(Date.now() + slaHours * 60 * 60 * 1000)
              : null;

          await tx.workflowInstance.create({
            data: {
              applicationId: options.submissionId,
              workflowDefinitionVersion: workflowVersion,
              currentStep: Number(workflowConfig.step),
              currentRoleId: Number(workflowConfig.currentRoleId),
              jurisdictionLevel: String(
                workflowConfig.jurisdictionLevel ||
                  latestSubmission.processingLevel ||
                  'DISTRICT',
              ),
              status: 'ACTIVE',
              dueAt,
            },
          });

          await tx.workflowAudit.create({
            data: {
              applicationId: options.submissionId,
              fromStep: null,
              toStep: Number(workflowConfig.step),
              action: 'INIT',
              actorUserId: Number(options.userId),
              remarks: 'Workflow instance initialized during investor submit',
              payload: {
                serviceId: options.serviceId,
                workflowConfigVersion: workflowVersion,
                currentStep: Number(workflowConfig.step),
                currentRoleId: Number(workflowConfig.currentRoleId),
              },
            },
          });
        } else if (
          String(latestSubmission.applicationStatus || '').toUpperCase() ===
            'RBI' &&
          Number(currentInstance.currentRoleId || 0) !== Number(userRoleId || 0)
        ) {
          // Keep workflow runtime aligned with RBI status so investor resubmit is not blocked by stale role ownership.
          const slaHours = Number(workflowConfig.slaHours || 0);
          const dueAt =
            slaHours > 0
              ? new Date(Date.now() + slaHours * 60 * 60 * 1000)
              : null;
          await tx.workflowInstance.update({
            where: { id: currentInstance.id },
            data: {
              workflowDefinitionVersion: workflowVersion,
              currentStep: Number(currentStepConfig.step || workflowConfig.step || 1),
              currentRoleId: Number(userRoleId),
              jurisdictionLevel: String(
                workflowConfig.jurisdictionLevel ||
                  latestSubmission.processingLevel ||
                  'DISTRICT',
              ),
              status: 'PENDING',
              dueAt,
            },
          });

          await tx.workflowAudit.create({
            data: {
              applicationId: options.submissionId,
              fromStep: Number(currentInstance.currentStep || 0) || null,
              toStep: Number(currentStepConfig.step || workflowConfig.step || 1),
              action: 'SYNC_RBI_TO_INVESTOR',
              actorUserId: Number(options.userId),
              remarks: 'Workflow instance synchronized for investor resubmission after RBI',
              payload: {
                serviceId: options.serviceId,
                workflowConfigVersion: workflowVersion,
                syncedRoleId: Number(userRoleId),
              },
            },
          });
        }

        const rawActionAllowed = Array.isArray(workflowConfig.actionAllowedJson)
          ? (workflowConfig.actionAllowedJson as string[])
          : [];
        const actionAllowed = rawActionAllowed
          .map((x) => this.normalizeWorkflowActionKey(String(x || '')))
          .filter((x) => !!x);

        const rawTransitionMap = (workflowConfig.transitionMapJson as any) || {};
        const transitionMap: Record<string, any> = {};
        Object.keys(rawTransitionMap).forEach((key) => {
          const normalizedKey = this.normalizeWorkflowActionKey(key);
          transitionMap[normalizedKey] = rawTransitionMap[key];
        });

        let submitAction = 'F';
        if (actionAllowed.includes('F')) {
          submitAction = 'F';
        } else if (actionAllowed.includes('FA')) {
          submitAction = 'FA';
        } else if (transitionMap['F']) {
          submitAction = 'F';
        } else if (transitionMap['FA']) {
          submitAction = 'FA';
        } else if (actionAllowed.length) {
          submitAction = actionAllowed[0];
        }

        return {
          userRoleId,
          submitAction,
          transitionMap,
          processingLevel: latestSubmission.processingLevel,
          fallbackNextRoleId:
            workflowConfig.nextAllocationRoleId ||
            workflowConfig.nextRoleId ||
            null,
        };
      });

      await this.workflowRuntimeService.processAction({
        submissionId: options.submissionId,
        serviceId: options.serviceId,
        action: submitSetup.submitAction as any,
        processingLevel: submitSetup.processingLevel as any,
        comments: 'Application submitted by investor',
        userId: options.userId,
        userRoleId: submitSetup.userRoleId,
        ipAddress: options.ipAddress || '',
        userAgent: options.userAgent || '',
      });

      await this.prisma.applicationSubmission.update({
        where: { submissionId: options.submissionId },
        data: {
          submittedOn: now,
          applicationUpdatedDateTime: now,
          ipAddress: options.ipAddress || '',
          userAgent: options.userAgent || '',
        },
      });

      await this.prisma.spApplication.updateMany({
        where: { appId: BigInt(options.submissionId) },
        data: {
          appComments: 'Application submitted',
          updatedOn: now,
        },
      });

      const transition = submitSetup.transitionMap[submitSetup.submitAction] || null;
      const nextRoleId = Array.isArray(transition?.next_roles)
        ? (transition.next_roles as any[])
            .map((x: any) => Number(x))
            .find((x: number) => Number.isFinite(x) && x > 0) || null
        : submitSetup.fallbackNextRoleId ||
          null;

      if (
        await this.shouldLogHistory(
          options.submissionId,
          options.serviceId,
          'P',
        )
      ) {
        await this.prisma.applicationHistory.create({
          data: {
            sno: spRecord?.sno ?? null,
            serviceId: options.serviceId,
            spTag,
            appId: String(options.submissionId),
            applicationStatus: 'P',
            comments: this.buildHistoryComment('P'),
            approverId: null,
            approverDetails: actorInfo.displayName,
            nextApprover: nextRoleId ? String(nextRoleId) : null,
            addedDateTime: now,
            sentDatedTime: null,
            roleId: String(submitSetup.userRoleId),
            roleName: actorInfo.roleName,
            roleUserInfo: actorInfo.displayName,
            nextRoleId: nextRoleId ? String(nextRoleId) : null,
            remoteServer: options.ipAddress || '',
            userAgent: options.userAgent || '',
          },
        });
      }
    }

    return { submissionId: options.submissionId };
  }
}
