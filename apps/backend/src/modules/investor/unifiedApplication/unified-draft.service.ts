import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UnifiedDraftService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Build UBU ID from PAN + UK + district + primary activity initial.
  private buildUbuId(formData: any, districtId: number) {
    const pan = String(formData?.company?.pan || '').trim();
    const activity = String(formData?.company?.primary_activity || '').trim();
    const activityInitial = activity ? activity.charAt(0).toUpperCase() : '';
    const district = districtId ? String(districtId) : '';
    if (!pan || !district || !activityInitial) return null;
    return `${pan}UK${district}${activityInitial}`;
  }

  // Build app location from land details or corporate address.
  private buildAppLocation(formData: any) {
    const land = formData?.requirement?.land || {};
    const parts = [land.land_code, land.survey_no, land.village, land.block, land.district]
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
  private buildRevertedCallbackUrl(serviceId: string, submissionId: number, departmentId?: number) {
    const params = new URLSearchParams();
    params.set('submissionId', String(submissionId));
    params.set('mode', 'edit');
    params.set('serviceId', String(serviceId));
    if (departmentId) params.set('departmentId', String(departmentId));
    return `/investor/departmentservice/unifiedapplication?${params.toString()}`;
  }

  // Deep merge while keeping latest __currentStep and non-empty values.
  private mergeDeep(base: any, override: any) {
    if (Array.isArray(base) || Array.isArray(override)) {
      return override ?? base;
    }
    if (base && typeof base === 'object' && override && typeof override === 'object') {
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
      normalized.promoter.entries = normalized.promoter.entries.map((entry: any) => {
        if (entry && typeof entry === 'object' && 'entries' in entry) {
          const next = { ...entry };
          delete next.entries;
          return next;
        }
        return entry;
      });

      if (normalized.promoter.entries.length > 0) {
        Object.keys(normalized.promoter).forEach((key) => {
          if (key === 'entries') return;
          const value = normalized.promoter[key];
          if (value === '' || value === null || value === undefined || value === false) {
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
    return `/investor/departmentservice/unifiedapplication?submissionId=${submissionId}&mode=view`;
  }

  private async getLatestSuccessfulPayment(submissionId: number, userId: bigint) {
    const payment = await this.prisma.paymentDetail.findFirst({
      where: {
        appSubId: submissionId,
        userId: Number(userId),
        statusCode: 'S',
      },
      orderBy: { created: 'desc' },
    });
    return payment || null;
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

  private async shouldLogHistory(appId: number, serviceId: string, status: string) {
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

  private async syncDocumentMappings(options: {
    submissionId: number;
    userId: bigint;
    serviceId: string;
    deptId: number;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const service = await this.prisma.service.findFirst({
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
            item.documentMasterId
        )
      )
      .filter((id: number) => Number.isFinite(id));

    if (!docIds.length) return;

    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: options.userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) return;

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { sno: true },
    });
    if (!spApp?.sno) return;

    const existingMappings = await this.prisma.applicationDmsDocumentsMapping.findMany({
      where: { sno: BigInt(spApp.sno), userId: BigInt(options.userId) },
      select: { documentsId: true },
    });
    const mappedDocumentIds = new Set(
      existingMappings.map((item) => Number(item.documentsId)).filter(Number.isFinite)
    );

    const investorDocs = await this.prisma.investorDocument.findMany({
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

      await this.prisma.applicationDmsDocumentsMapping.create({
        data: {
          iuid: BigInt(investorProfile.uid),
          userId: BigInt(options.userId),
          sno: BigInt(spApp.sno),
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
      throw new BadRequestException('Application is not editable in current status');
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
        { label: 'Date of Incorporation', value: options.formData?.company?.incorporation_date },
        { label: 'City', value: corp.city },
        { label: 'Address Line 1', value: corp.address1 },
        { label: 'Pin Code', value: corp.pincode },
        { label: 'Email ID', value: corp.email },
        { label: 'Country Code', value: corp.country_code },
        { label: 'Mobile Number', value: corp.mobile },
      ];
      const missing = required.filter((item) => !item.value || String(item.value).trim() === '');
      if (missing.length) {
        throw new BadRequestException(
          `Missing required fields: ${missing.map((item) => item.label).join(', ')}`
        );
      }
    }

    const service = await this.prisma.service.findFirst({
      where: { service_id: options.serviceId },
    });
    const resolvedDepartmentId = options.departmentId || service?.department_id || 0;
    const department = resolvedDepartmentId
      ? await this.prisma.department.findUnique({
          where: { id: resolvedDepartmentId },
        })
      : null;
    const district = await this.prisma.district.findUnique({
      where: { id: options.districtId },
    });

    const spTag = department?.uniqueTag || (options.serviceId === '943.0' ? 'DOI@908#123' : '');
    const spAppId = service?.swcs_service_id ? String(service.swcs_service_id) : options.serviceId;
    const sanitizedFormData = this.sanitizeFormData(options.formData);
    const masterDistrictId = this.resolveMasterDistrictId(sanitizedFormData, options.districtId);
    const draftStatus = this.getStatusForStep(options.currentStep);
    const resolvedUbuId = options.existingUbuId || this.buildUbuId(sanitizedFormData, masterDistrictId);

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
    const appLocation = this.buildAppLocation(sanitizedFormData);
    const revertedCallBackUrl =
      options.revertedCallBackUrl ||
      this.buildRevertedCallbackUrl(options.serviceId, submission.submissionId, resolvedDepartmentId);
    const printAppCallBackUrl =
      options.printAppCallBackUrl || this.buildPrintAppUrl(submission.submissionId);

    const spCreated = await this.prisma.spApplication.create({
      data: {
        spTag,
        spAppId,
        appId: BigInt(submission.submissionId),
        appName: service?.service_name || 'Unified Department Service Application',
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
        downloadCertificateCallBackUrl: options.downloadCertificateCallBackUrl || '',
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

    if (await this.shouldLogHistory(submission.submissionId, options.serviceId, draftStatus)) {
      await this.prisma.applicationHistory.create({
        data: {
          sno: spCreated?.sno ?? null,
          serviceId: options.serviceId,
          spTag,
          appId: String(submission.submissionId),
          applicationStatus: draftStatus,
          comments: this.buildHistoryComment(draftStatus, options.currentStep),
          approverId: null,
          approverDetails: null,
          nextApprover: null,
          addedDateTime: now,
          sentDatedTime: null,
          roleId: null,
          roleName: null,
          roleUserInfo: null,
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
        { label: 'Date of Incorporation', value: options.formData?.company?.incorporation_date },
        { label: 'City', value: corp.city },
        { label: 'Address Line 1', value: corp.address1 },
        { label: 'Pin Code', value: corp.pincode },
        { label: 'Email ID', value: corp.email },
        { label: 'Country Code', value: corp.country_code },
        { label: 'Mobile Number', value: corp.mobile },
      ];
      const missing = required.filter((item) => !item.value || String(item.value).trim() === '');
      if (missing.length) {
        throw new BadRequestException(
          `Missing required fields: ${missing.map((item) => item.label).join(', ')}`
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

    const service = await this.prisma.service.findFirst({
      where: { service_id: options.serviceId },
    });
    const resolvedDepartmentId = options.departmentId || service?.department_id || submission.deptId || 0;
    const department = resolvedDepartmentId
      ? await this.prisma.department.findUnique({
          where: { id: resolvedDepartmentId },
        })
      : null;

    const spTag = department?.uniqueTag || (options.serviceId === '943.0' ? 'DOI@908#123' : '');
    const spAppId = service?.swcs_service_id ? String(service.swcs_service_id) : options.serviceId;
    const sanitizedFormDataUpdate = this.sanitizeFormData(options.formData);
    const masterDistrictId = this.resolveMasterDistrictId(sanitizedFormDataUpdate, options.districtId);
    const appLocation = this.buildAppLocation(sanitizedFormDataUpdate);
    const revertedCallBackUrl =
      options.revertedCallBackUrl ||
      this.buildRevertedCallbackUrl(options.serviceId, options.submissionId, resolvedDepartmentId);
    const printAppCallBackUrl =
      options.printAppCallBackUrl || this.buildPrintAppUrl(options.submissionId);

    const paymentInfo =
      Number(options.currentStep) === 6
        ? await this.getLatestSuccessfulPayment(options.submissionId, options.userId)
        : null;
    const serviceIdNumber = Number(String(options.serviceId).split('.')[0] || 0);
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
      sanitizedFormDataUpdate || {}
    );

    const draftStatus = this.getStatusForStep(options.currentStep);
    const resolvedUbuId =
      options.existingUbuId ||
      submission.ubuId ||
      this.buildUbuId(sanitizedFormDataUpdate, masterDistrictId);

    await this.prisma.applicationSubmission.update({
      where: { submissionId: options.submissionId },
      data: {
        serviceId: options.serviceId,
        deptId: resolvedDepartmentId,
        formId: options.formTypeId || null,
        fieldValue: mergedFieldValue || {},
        unitName: options.unitName || null,
        applicationStatus: draftStatus,
        applicationUpdatedDateTime: now,
        ipAddress: options.ipAddress || '',
        userAgent: options.userAgent || '',
        processingLevel: (options.processingLevel as any) || submission.processingLevel,
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
        downloadCertificateCallBackUrl: options.downloadCertificateCallBackUrl || '',
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
          appName: service?.service_name || 'Unified Department Service Application',
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
          downloadCertificateCallBackUrl: options.downloadCertificateCallBackUrl || '',
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

    if (await this.shouldLogHistory(options.submissionId, options.serviceId, draftStatus)) {
      await this.prisma.applicationHistory.create({
        data: {
          sno: spRecord?.sno ?? null,
          serviceId: options.serviceId,
          spTag,
          appId: String(options.submissionId),
          applicationStatus: draftStatus,
          comments: this.buildHistoryComment(draftStatus, options.currentStep),
          approverId: null,
          approverDetails: null,
          nextApprover: null,
          addedDateTime: now,
          sentDatedTime: null,
          roleId: null,
          roleName: null,
          roleUserInfo: null,
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
      const user = await this.prisma.users.findUnique({
        where: { id: options.userId },
        select: { role_id: true },
      });
      const workflowConfig = await this.prisma.applicationWorkflowConfiguration.findFirst({
        where: {
          departmentId: resolvedDepartmentId,
          serviceId: options.serviceId,
          processingLevel: submission.processingLevel,
          currentRoleId: Number(user?.role_id || 0),
          formTypeId: options.formTypeId || submission.formId || 1,
        },
        orderBy: { step: 'asc' },
      });

      const nextRoleId = workflowConfig?.nextRoleId || null;
      const verifierUserId = workflowConfig?.approverId || null;

      const nextOfficer = nextRoleId
        ? await this.prisma.department_users.findFirst({
            where: {
              dept_id: resolvedDepartmentId,
              district_id: masterDistrictId,
              user: { role_id: nextRoleId },
            },
            include: { user: true },
          })
        : null;

      const nextUserId = nextOfficer?.user_id ? Number(nextOfficer.user_id) : null;
      const forwardedDeptId = nextOfficer?.dept_id ?? resolvedDepartmentId;
      const forwardedDistId = nextOfficer?.district_id ?? masterDistrictId;

      await this.prisma.applicationSubmission.update({
        where: { submissionId: options.submissionId },
        data: {
          applicationStatus: 'P',
          approvalId: nextRoleId,
          submittedOn: now,
          applicationUpdatedDateTime: now,
          ipAddress: options.ipAddress || '',
          userAgent: options.userAgent || '',
        },
      });

      await this.prisma.spApplication.updateMany({
        where: { appId: BigInt(options.submissionId) },
        data: {
          appStatus: 'P',
          appComments: 'Application submitted',
          updatedOn: now,
        },
      });

      await this.prisma.forwardApplication.create({
        data: {
          nextRoleId,
          nextUserId,
          verifierUserId: verifierUserId ? Number(verifierUserId) : null,
          appSubId: options.submissionId,
          forwardedDeptId,
          forwardedDistId,
          formId: options.formTypeId || submission.formId || null,
          postInfo: 'Application submitted by investor',
          actionTaken: null,
          actionStatus: 'P',
          verifierUserComment: null,
          supportiveDocument: null,
          createdOn: now,
          updatedDateTime: null,
          userAgent: options.userAgent || '',
          commentDate: null,
          inspectionDate: null,
          inspectionStartDate: null,
          inspectionEndDate: null,
          reasonForDelay: null,
          supportDocument: null,
          inspectionReport: null,
          educationAakhyaDocument: null,
          ipAddress: options.ipAddress || '',
          approvStatus: 'P',
          scrutinyCommitteeMeetingDate: null,
          claimReceipt: null,
          lineDeptCafApprovalStatus: null,
          geoReport: null,
          megaIncentiveClaimedAmount: null,
          rowRejectionCode: null,
          evaluationMatrixDocument: null,
        },
      });

      if (await this.shouldLogHistory(options.submissionId, options.serviceId, 'P')) {
        await this.prisma.applicationHistory.create({
          data: {
            sno: spRecord?.sno ?? null,
            serviceId: options.serviceId,
            spTag,
            appId: String(options.submissionId),
            applicationStatus: 'P',
            comments: this.buildHistoryComment('P'),
            approverId: null,
            approverDetails: null,
            nextApprover: nextRoleId ? String(nextRoleId) : null,
            addedDateTime: now,
            sentDatedTime: null,
            roleId: user?.role_id ? String(user.role_id) : null,
            roleName: null,
            roleUserInfo: null,
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

