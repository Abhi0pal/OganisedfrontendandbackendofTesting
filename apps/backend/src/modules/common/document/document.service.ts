import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CommonDocumentService {
  constructor(private readonly prisma: PrismaService) { }

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

  private pickLatestDocument<T extends { documentVersion?: string | null; createdAt?: Date | null }>(
    current: T | undefined,
    candidate: T,
  ) {
    if (!current) return candidate;

    const candidateParts = this.getVersionParts(candidate.documentVersion);
    const currentParts = this.getVersionParts(current.documentVersion);
    if (
      candidateParts.major > currentParts.major ||
      (candidateParts.major === currentParts.major &&
        candidateParts.minor > currentParts.minor)
    ) {
      return candidate;
    }

    if (
      candidateParts.major === currentParts.major &&
      candidateParts.minor === currentParts.minor &&
      candidate.createdAt &&
      current.createdAt &&
      candidate.createdAt > current.createdAt
    ) {
      return candidate;
    }

    return current;
  }

  private async resolveSubmissionMappingContext(submissionId: number) {
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
      select: { sno: true, createdOn: true },
    });

    return {
      submission,
      resolvedSno: spApp?.sno ? BigInt(spApp.sno) : BigInt(submissionId),
      applicationCreatedOn: spApp?.createdOn ?? null,
    };
  }

  async getServiceDms(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
      select: { dms: true },
    });
    if (!service?.dms) return null;
    return typeof service.dms === 'string'
      ? JSON.parse(service.dms)
      : service.dms;
  }

  async getDocumentChecklist(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
      select: { dms: true },
    });

    if (!service?.dms) {
      return [];
    }

    let dms: any;
    try {
      dms = typeof service.dms === 'string' ? JSON.parse(service.dms) : service.dms;
    } catch (error) {
      console.warn(`Failed to parse DMS JSON for service ${serviceId}:`, error);
      return [];
    }

    const documentTypes = Array.isArray(dms?.documentTypes)
      ? dms.documentTypes
      : [];

    const rows: any[] = [];
    documentTypes.forEach((type: any) => {
      const checklists = Array.isArray(type.checklists) ? type.checklists : [];
      checklists.forEach((checklist: any) => {
        const allowed = Array.isArray(checklist.allowedFormats)
          ? checklist.allowedFormats
          : [];
        rows.push({
          id: Number(checklist.id),
          checklistId: String(checklist.id || ''),
          name: checklist.name || '',
          extension: allowed.join(','),
          maxSize: Number(checklist.maxSizeMb || 0),
          documentType: type.name || null,
          departmentId: null,
          isRequired: checklist.isRequired ? 'Y' : 'N',
          comment: checklist?.meta?.comment || checklist?.description || '',
          isMultiVersionAllowed: checklist?.isMultiVersionAllowed ?? true,
          isDocValidityRequired: checklist?.isDocValidityRequired ?? false,
        });
      });
    });

    return rows.filter((row) => Number.isFinite(row.id));
  }

  async getUploadedDocuments(options: {
    submissionId: number;
    serviceId: string;
    userId: bigint;
  }) {
    const [investorProfile, checklist, submissionContext] = await Promise.all([
      this.prisma.investor_profiles.findUnique({
        where: { user_id: options.userId },
        select: { uid: true },
      }),
      this.getDocumentChecklist(options.serviceId),
      this.resolveSubmissionMappingContext(options.submissionId),
    ]);

    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    const mappings = await this.prisma.applicationDmsDocumentsMapping.findMany({
      where: {
        sno: submissionContext.resolvedSno,
        userId: options.userId,
        serviceId: options.serviceId,
      },
      select: { documentsId: true, documentFileName: true },
    });

    if (!mappings.length) {
      return { uploads: [] };
    }

    const checklistIds = checklist
      .map((item: any) => Number(item.id))
      .filter(Number.isFinite);

    if (!checklistIds.length) {
      return { uploads: [] };
    }

    const mappedDocs = await this.prisma.applicationDmsDocumentsMapping.findMany({
      where: {
        sno: submissionContext.resolvedSno,
        userId: BigInt(options.userId),
        serviceId: options.serviceId,
      },
      select: {
        mappingId: true,
        documentsId: true,
      },
      orderBy: { mappingId: 'desc' },
    });

    const mappedDocIds = mappedDocs
      .map((item) => Number(item.documentsId))
      .filter(Number.isFinite);
    const displayNameByDocumentId = new Map(
      mappings
        .map((item) => [Number(item.documentsId), item.documentFileName] as const)
        .filter(([documentsId]) => Number.isFinite(documentsId)),
    );

    if (!mappedDocIds.length) {
      return { uploads: [] };
    }

    const investorDocs = await this.prisma.investorDocument.findMany({
      where: {
        id: { in: mappedDocIds.map((id) => BigInt(id)) },
        documentMasterId: { in: checklistIds },
        investorProfileUid: investorProfile.uid,
      },
      select: {
        id: true,
        documentMasterId: true,
        documentName: true,
        documentReferenceNumber: true,
        documentVersion: true,
        documentStatus: true,
        createdAt: true,
        documentPath: true,
      },
    });

    const applicationCreatedOn = submissionContext.applicationCreatedOn;
    const filteredInvestorDocs = applicationCreatedOn
      ? investorDocs.filter(
        (doc) => doc.createdAt && doc.createdAt >= applicationCreatedOn,
      )
      : investorDocs;

    const latestByMaster = new Map<number, any>();
    for (const doc of filteredInvestorDocs) {
      latestByMaster.set(
        doc.documentMasterId,
        this.pickLatestDocument(latestByMaster.get(doc.documentMasterId), doc),
      );
    }

    const docs: Array<{
      documentMasterId: number;
      documentsId: number;
      checklistId: string | null;
      fileName: string;
      originalName: string;
      filePath: string;
      status: string;
      createdOn: Date;
      versionType: string;
      version: string;
    }> = [];

    for (const investorDoc of latestByMaster.values()) {
      const filePath = investorDoc.documentPath || `uploads/investorDocuments/${investorProfile.uid}/${investorDoc.documentName}`;
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
        originalName: displayNameByDocumentId.get(Number(investorDoc.id)) || '',
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
    serviceId?: string; // for cases where submission record may not exist
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

    let submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: {
        submissionId: true,
        deptId: true,
        serviceId: true,
        processingLevel: true,
      },
    });
    if (!submission) {
      // if we don't have an application record, assume this is a service that
      // doesn't use the submission table (eg. incentive).  We will still allow
      // file upload but some fields like deptId will default later.
      if (!options.serviceId) {
        throw new BadRequestException('Submission not found');
      }
      // keep submission undefined and proceed
    }

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(submissionId) },
      select: { sno: true, appStatus: true },
    });
    if (!spApp?.sno) {
      // missing mapping is fine for incentive-style services; just skip
      // status checks that follow
    }

    const resolvedSno = spApp?.sno ? BigInt(spApp.sno) : BigInt(submissionId);

    const allowedStatuses = ['I', 'RBI', 'H', 'DP', 'PD'];
    if (spApp?.appStatus && !allowedStatuses.includes(spApp.appStatus)) {
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

    const extensionAliases: Record<string, string[]> = {
      jpg: ['jpg', 'jpeg'],
      jpeg: ['jpg', 'jpeg'],
      tif: ['tif', 'tiff'],
      tiff: ['tif', 'tiff'],
      htm: ['htm', 'html'],
      html: ['htm', 'html'],
    };
    const fromDms = new Set<string>();
    if (options.serviceId) {
      const dms = await this.getServiceDms(String(options.serviceId));
      const types = Array.isArray((dms as any)?.documentTypes) ? (dms as any).documentTypes : [];
      for (const type of types) {
        const checklists = Array.isArray(type?.checklists) ? type.checklists : [];
        const found = checklists.find((c: any) => Number(c?.id) === Number(documentMasterId));
        if (!found) continue;
        const allowedFormats = Array.isArray(found?.allowedFormats) ? found.allowedFormats : [];
        allowedFormats
          .map((item: any) => String(item || '').trim().toLowerCase().replace(/^\./, ''))
          .filter(Boolean)
          .forEach((ext: string) => fromDms.add(ext));
        break;
      }
    }
    const rawAllowedExtensions = (fromDms.size
      ? Array.from(fromDms)
      : String(master.checklistDocumentExtension || '')
        .split(',')
        .map((item) => item.trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean));
    const allowedExtensionSet = new Set<string>();
    rawAllowedExtensions.forEach((ext) => {
      allowedExtensionSet.add(ext);
      (extensionAliases[ext] || []).forEach((alias) => allowedExtensionSet.add(alias));
    });
    const incomingExt = originalName.includes('.')
      ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
      : '';
    if (allowedExtensionSet.size && !allowedExtensionSet.has(incomingExt)) {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
      }
      const allowedList = Array.from(allowedExtensionSet).sort().map((ext) => `.${ext}`);
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedList.join(', ')}`,
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
      submission &&
        submission.processingLevel &&
        String(submission.processingLevel).toLowerCase() === 'state'
        ? 2
        : 1;

    const created = await this.prisma.investorDocument.create({
      data: {
        documentMasterId: master.id,
        documentTypeId: master.documentTypeId,
        issuerId,
        departmentId: submission?.deptId ?? master.departmentId,
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

    const effectiveServiceId = String(options.serviceId || submission?.serviceId || '').trim();
    if (effectiveServiceId) {
      const mapping = await this.prisma.applicationDmsDocumentsMapping.create({
        data: {
          iuid: BigInt(investorProfile.uid),
          userId: BigInt(userId),
          sno: resolvedSno,
          serviceId: effectiveServiceId,
          deptId: submission?.deptId ?? master.departmentId ?? 0,
          documentsId: Number(created.id),
          documentFileName: documentName,
          status: 'U',
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          createdOn: new Date(),
          lastUpdated: null,
          comments: comments || null,
          isUploadedFlag: 1,
        },
      });

      await this.prisma.applicationDmsDocumentsMappingLog.create({
        data: {
          mappingId: BigInt(mapping.mappingId),
          documentsId: BigInt(created.id),
          status: 'U',
          deptUserId: 0,
          verifierName: null,
          verifierDesignation: null,
          verifierComments: null,
          createdTime: new Date(),
          isDraft: '0',
          remoteIp: ipAddress ? String(ipAddress).slice(0, 100) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
        },
      });
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

  async syncDocumentMappings(options: {
    submissionId: number;
    userId: bigint;
    serviceId: string;
    deptId: number;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    await this.resolveSubmissionMappingContext(options.submissionId);

    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: options.userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) return;
return;

    /* 
    // Legacy sync logic disabled - kept for reference
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

      const mapping = await this.prisma.applicationDmsDocumentsMapping.create({
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

      await this.prisma.applicationDmsDocumentsMappingLog.create({
        data: {
          mappingId: BigInt(mapping.mappingId),
          documentsId: BigInt(docId),
          status: 'U',
          deptUserId: 0,
          verifierName: null,
          verifierDesignation: null,
          verifierComments: null,
          createdTime: new Date(),
          isDraft: '0',
          remoteIp: options.ipAddress ? options.ipAddress.slice(0, 20) : null,
          userAgent: options.userAgent ? options.userAgent.slice(0, 255) : null,
        },
      });
    }
    */
  }
}
