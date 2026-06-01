import { PrismaClient } from '@prisma/client';
import { inprincipleLiveSnapshotData } from './data/inprinciple-live-snapshot.data';

const toBigInt = (value: unknown): bigint | null => {
  if (value === null || value === undefined || value === '') return null;
  try {
    return BigInt(String(value));
  } catch {
    return null;
  }
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

function toObject<T extends Record<string, any>>(value: unknown): T {
  return (value || {}) as T;
}

export async function seedInprincipleLiveSnapshot(prisma: PrismaClient) {
  const source = inprincipleLiveSnapshotData;
  if (!source?.submission || !source?.spApplication) {
    console.warn('  [WARN] Inprinciple live snapshot data is empty. Skipping live snapshot seed.');
    return;
  }

  try {
    const investor = await prisma.users.findFirst({
      where: { email: source.source.investorEmail || 'investor@example.com' },
      include: { investor_profile: true },
    });

    if (!investor?.id || !investor.investor_profile?.uid) {
      console.warn('  [WARN] Investor user/profile not found. Skipping inprinciple live snapshot seed.');
      return;
    }

    const serviceId = String(source.source.serviceId || '943.0');

    // Keep one deterministic live snapshot row-set per service.
    const existingSubmissions = await prisma.applicationSubmission.findMany({
      where: {
        serviceId,
        unitName: { startsWith: 'LIVE SNAPSHOT IP' },
      },
      select: { submissionId: true },
    });
    const existingSubmissionIds = existingSubmissions.map((x) => x.submissionId);
    if (existingSubmissionIds.length > 0) {
      const existingSp = await prisma.spApplication.findMany({
        where: { appId: { in: existingSubmissionIds.map((id) => BigInt(id)) } },
        select: { sno: true },
      });
      const existingSnos = existingSp.map((x) => x.sno);

      if (existingSnos.length > 0) {
        await prisma.applicationDmsDocumentsMapping.deleteMany({
          where: { sno: { in: existingSnos.map((s) => BigInt(s)) } },
        });
      }
      await prisma.paymentDetail.deleteMany({ where: { appSubId: { in: existingSubmissionIds } } });
      await prisma.forwardApplication.deleteMany({ where: { appSubId: { in: existingSubmissionIds } } });
      await prisma.applicationHistory.deleteMany({
        where: {
          OR: [
            { appId: { in: existingSubmissionIds.map((id) => String(id)) } },
            { sno: { in: existingSnos } },
          ],
        },
      });
      await prisma.spApplication.deleteMany({
        where: { appId: { in: existingSubmissionIds.map((id) => BigInt(id)) } },
      });
      await prisma.applicationSubmission.deleteMany({
        where: { submissionId: { in: existingSubmissionIds } },
      });
    }

    const submissionRaw = toObject<any>(source.submission);
    const oldSubmissionId = Number(submissionRaw.submissionId);

    const submissionData = {
      parentSubId: Number(submissionRaw.parentSubId || 0),
      applicationId: Number(submissionRaw.applicationId || 12),
      serviceId: String(submissionRaw.serviceId || serviceId),
      userId: investor.id,
      deptId: Number(submissionRaw.deptId || 1),
      formId: submissionRaw.formId ? Number(submissionRaw.formId) : null,
      approvalId: submissionRaw.approvalId ? Number(submissionRaw.approvalId) : null,
      fieldValue: submissionRaw.fieldValue || {},
      unitName: `LIVE SNAPSHOT IP ${submissionRaw.unitName || oldSubmissionId || '1'}`,
      certificatePath: submissionRaw.certificatePath ?? null,
      kmlPath: submissionRaw.kmlPath ?? null,
      applicationStatus: String(submissionRaw.applicationStatus || 'P'),
      disbursementStatus: submissionRaw.disbursementStatus ?? null,
      applicationCreatedDate: toDate(submissionRaw.applicationCreatedDate) || new Date(),
      applicationUpdatedDateTime: toDate(submissionRaw.applicationUpdatedDateTime) || new Date(),
      ipAddress: String(submissionRaw.ipAddress || '127.0.0.1'),
      userAgent: String(submissionRaw.userAgent || 'seed/inprinciple-live-snapshot'),
      processingLevel: submissionRaw.processingLevel || 'District',
      landrigionId: Number(submissionRaw.landrigionId || 1),
      allLandrigionId: submissionRaw.allLandrigionId ?? null,
      isInvestmentVerified: submissionRaw.isInvestmentVerified ?? null,
      isEmploymentVerified: submissionRaw.isEmploymentVerified ?? null,
      isLocationVerified: submissionRaw.isLocationVerified ?? null,
      refrenceSubId: submissionRaw.refrenceSubId ? Number(submissionRaw.refrenceSubId) : null,
      refLiceneceNumber: submissionRaw.refLiceneceNumber ?? null,
      feeOfApplication: submissionRaw.feeOfApplication ?? null,
      image: submissionRaw.image ?? null,
      publishedByOfficerId: submissionRaw.publishedByOfficerId ? Number(submissionRaw.publishedByOfficerId) : null,
      publishedOn: toDate(submissionRaw.publishedOn),
      ssoType: submissionRaw.ssoType ?? null,
      ssoApprovalId: submissionRaw.ssoApprovalId ?? null,
      submittedOn: toDate(submissionRaw.submittedOn),
      legacyDataStatus: submissionRaw.legacyDataStatus || 'N',
      autoRenewalValidityYear: submissionRaw.autoRenewalValidityYear ? Number(submissionRaw.autoRenewalValidityYear) : null,
      tourismRefNumber: Number(submissionRaw.tourismRefNumber || 0),
      appealId: toBigInt(submissionRaw.appealId),
      businessEntityCode: submissionRaw.businessEntityCode ?? null,
      withdrawnDate: toDate(submissionRaw.withdrawnDate),
      deemedApproved: submissionRaw.deemedApproved ?? null,
      unitPanno: submissionRaw.unitPanno ?? null,
      unitPannoUpdatedDate: toDate(submissionRaw.unitPannoUpdatedDate),
      isMsmeapp2015Active: submissionRaw.isMsmeapp2015Active ?? '1',
      ubuId: submissionRaw.ubuId ?? null,
    };

    const createdSubmission = await prisma.applicationSubmission.create({ data: submissionData as any });

    const oldInvestorDocIdToNewId = new Map<number, number>();
    const sourceDocs = Array.isArray(source.investorDocuments) ? source.investorDocuments : [];
    for (const docRaw of sourceDocs as any[]) {
      const oldDocId = Number(docRaw.id || 0);
      const ref = `${investor.investor_profile.uid}_LIVE_${createdSubmission.submissionId}_${oldDocId || Date.now()}`;
      const createdDoc = await prisma.investorDocument.create({
        data: {
          documentMasterId: Number(docRaw.documentMasterId),
          documentTypeId: Number(docRaw.documentTypeId),
          issuerId: Number(docRaw.issuerId),
          departmentId: Number(docRaw.departmentId),
          investorProfileUid: investor.investor_profile.uid,
          userId: investor.id,
          documentReferenceNumber: ref,
          documentName: docRaw.documentName || `${ref}.pdf`,
          documentVersion: docRaw.documentVersion || 'V1.0',
          documentStatus: docRaw.documentStatus || 'U',
          isDocumentActive: docRaw.isDocumentActive || 'Y',
          documentPath: docRaw.documentPath || '',
          validFrom: toDate(docRaw.validFrom),
          validTo: toDate(docRaw.validTo),
          documentDateOfIssuance: toDate(docRaw.documentDateOfIssuance),
          comments: docRaw.comments ?? null,
          createdAt: toDate(docRaw.createdAt) || new Date(),
          updatedAt: toDate(docRaw.updatedAt) || new Date(),
        } as any,
      });
      if (oldDocId) oldInvestorDocIdToNewId.set(oldDocId, Number(createdDoc.id));
    }

    const spRaw = toObject<any>(source.spApplication);
    const oldSno = Number(spRaw.sno || 0);
    const createdSp = await prisma.spApplication.create({
      data: {
        spTag: String(spRaw.spTag || 'DOI@908#123'),
        spAppId: String(spRaw.spAppId || submissionData.serviceId),
        appId: BigInt(createdSubmission.submissionId),
        appName: String(spRaw.appName || 'In-principle Application'),
        appFields: spRaw.appFields || {},
        appStatus: String(spRaw.appStatus || 'P'),
        boNewDisbursementStatus: spRaw.boNewDisbursementStatus ?? null,
        appComments: String(spRaw.appComments || ''),
        appDistt: String(spRaw.appDistt || ''),
        appDisttName: String(spRaw.appDisttName || ''),
        appLocation: String(spRaw.appLocation || ''),
        isAppliedByCaf: spRaw.isAppliedByCaf ?? null,
        cafId: Number(spRaw.cafId || 0),
        cafType: spRaw.cafType ?? null,
        unitName: String(spRaw.unitName || submissionData.unitName || ''),
        revertedCallBackUrl: String(spRaw.revertedCallBackUrl || ''),
        printAppCallBackUrl: String(spRaw.printAppCallBackUrl || ''),
        downloadCertificateCallBackUrl: String(spRaw.downloadCertificateCallBackUrl || ''),
        userId: investor.id,
        createdOn: toDate(spRaw.createdOn) || new Date(),
        updatedOn: toDate(spRaw.updatedOn) || new Date(),
        isActive: spRaw.isActive || 'Y',
        remoteServer: String(spRaw.remoteServer || '127.0.0.1'),
        userAgent: String(spRaw.userAgent || 'seed/inprinciple-live-snapshot'),
        param1: toBigInt(spRaw.param1) || BigInt(0),
        param2: String(spRaw.param2 || ''),
        param3: String(spRaw.param3 || ''),
        param4: String(spRaw.param4 || ''),
        param5: String(spRaw.param5 || ''),
        pHeadCode: spRaw.pHeadCode ?? null,
        pTreasCode: spRaw.pTreasCode ?? null,
        pDdoCode: spRaw.pDdoCode ?? null,
        isOfflineApplication: spRaw.isOfflineApplication || 'N',
        offlineApplicationId: toBigInt(spRaw.offlineApplicationId),
        timelineRef: spRaw.timelineRef ?? null,
        createdDateTime: toDate(spRaw.createdDateTime),
        lastUpdatedDateTime: toDate(spRaw.lastUpdatedDateTime),
        assignedTo: spRaw.assignedTo ?? null,
        circleId: spRaw.circleId ? Number(spRaw.circleId) : null,
        tehsilId: spRaw.tehsilId ? Number(spRaw.tehsilId) : null,
        blockId: spRaw.blockId ? Number(spRaw.blockId) : null,
        noe: spRaw.noe ? Number(spRaw.noe) : null,
        deptPortalAppId: spRaw.deptPortalAppId ?? null,
        isUploadedSignedCertificate: spRaw.isUploadedSignedCertificate ?? null,
        infowizServiceId: spRaw.infowizServiceId ?? null,
        legacyCapturedDate: toDate(spRaw.legacyCapturedDate),
        deemedApproved: spRaw.deemedApproved ?? null,
        certificateNo: spRaw.certificateNo ?? null,
        certificateIssueDate: toDate(spRaw.certificateIssueDate),
        certificateExpireDate: toDate(spRaw.certificateExpireDate),
      } as any,
    });

    const forwardRows = Array.isArray(source.forwardApplications) ? source.forwardApplications : [];
    for (const fRaw of forwardRows as any[]) {
      await prisma.forwardApplication.create({
        data: {
          nextRoleId: fRaw.nextRoleId ? Number(fRaw.nextRoleId) : null,
          nextUserId: fRaw.nextUserId ? Number(fRaw.nextUserId) : null,
          verifierUserId:
            Number(fRaw.verifierUserId) === Number(submissionRaw.userId)
              ? Number(investor.id)
              : fRaw.verifierUserId
                ? Number(fRaw.verifierUserId)
                : 0,
          appSubId: createdSubmission.submissionId,
          forwardedDeptId: fRaw.forwardedDeptId ? Number(fRaw.forwardedDeptId) : null,
          forwardedDistId: fRaw.forwardedDistId ? Number(fRaw.forwardedDistId) : null,
          formId: fRaw.formId ? Number(fRaw.formId) : null,
          postInfo: fRaw.postInfo ?? null,
          actionTaken: fRaw.actionTaken ?? null,
          actionStatus: fRaw.actionStatus ?? null,
          verifierUserComment: fRaw.verifierUserComment ?? null,
          supportiveDocument: fRaw.supportiveDocument ?? null,
          createdOn: toDate(fRaw.createdOn) || new Date(),
          updatedDateTime: toDate(fRaw.updatedDateTime),
          userAgent: String(fRaw.userAgent || 'seed/inprinciple-live-snapshot'),
          commentDate: toDate(fRaw.commentDate),
          inspectionDate: toDate(fRaw.inspectionDate),
          inspectionStartDate: toDate(fRaw.inspectionStartDate),
          inspectionEndDate: toDate(fRaw.inspectionEndDate),
          reasonForDelay: fRaw.reasonForDelay ?? null,
          supportDocument: fRaw.supportDocument ?? null,
          inspectionReport: fRaw.inspectionReport ?? null,
          educationAakhyaDocument: fRaw.educationAakhyaDocument ?? null,
          ipAddress: fRaw.ipAddress ?? null,
          approvStatus: fRaw.approvStatus ?? null,
          scrutinyCommitteeMeetingDate: toDate(fRaw.scrutinyCommitteeMeetingDate),
          claimReceipt: fRaw.claimReceipt ?? null,
          lineDeptCafApprovalStatus: fRaw.lineDeptCafApprovalStatus ? Number(fRaw.lineDeptCafApprovalStatus) : null,
          geoReport: fRaw.geoReport ?? null,
          megaIncentiveClaimedAmount: fRaw.megaIncentiveClaimedAmount ?? null,
          rowRejectionCode: fRaw.rowRejectionCode ? Number(fRaw.rowRejectionCode) : null,
          evaluationMatrixDocument: fRaw.evaluationMatrixDocument ?? null,
        },
      });
    }

    const historyRows = Array.isArray(source.applicationHistory) ? source.applicationHistory : [];
    for (const hRaw of historyRows as any[]) {
      await prisma.applicationHistory.create({
        data: {
          sno: oldSno && Number(hRaw.sno) === oldSno ? createdSp.sno : hRaw.sno ? Number(hRaw.sno) : null,
          serviceId: hRaw.serviceId ?? null,
          spTag: String(hRaw.spTag || spRaw.spTag || ''),
          appId:
            String(hRaw.appId || '') === String(oldSubmissionId)
              ? String(createdSubmission.submissionId)
              : String(hRaw.appId || ''),
          applicationStatus: String(hRaw.applicationStatus || 'P'),
          comments: hRaw.comments ?? null,
          approverId: hRaw.approverId ?? null,
          approverDetails: hRaw.approverDetails ?? null,
          nextApprover: hRaw.nextApprover ?? null,
          addedDateTime: toDate(hRaw.addedDateTime) || new Date(),
          sentDatedTime: toDate(hRaw.sentDatedTime),
          roleId: hRaw.roleId ?? null,
          roleName: hRaw.roleName ?? null,
          roleUserInfo: hRaw.roleUserInfo ?? null,
          nextRoleId: hRaw.nextRoleId ?? null,
          param1: hRaw.param1 ?? null,
          param2: hRaw.param2 ?? null,
          param3: hRaw.param3 ?? null,
          param4: hRaw.param4 ?? null,
          param5: hRaw.param5 ?? null,
          remoteServer: hRaw.remoteServer ?? null,
          userAgent: hRaw.userAgent ?? null,
          certificateNo: hRaw.certificateNo ?? null,
          certificateIssueDate: toDate(hRaw.certificateIssueDate),
          certificateExpireDate: toDate(hRaw.certificateExpireDate),
        },
      });
    }

    const paymentRows = Array.isArray(source.paymentDetails) ? source.paymentDetails : [];
    for (const pRaw of paymentRows as any[]) {
      await prisma.paymentDetail.create({
        data: {
          pgMeTrnRefNo: toBigInt(pRaw.pgMeTrnRefNo),
          orderId: toBigInt(pRaw.orderId),
          authNStatus: pRaw.authNStatus ?? null,
          authZStatus: pRaw.authZStatus ?? null,
          responseCode: pRaw.responseCode ?? null,
          bankReferenceBank: pRaw.bankReferenceBank ?? null,
          userId: Number(investor.id),
          applicationId: Number(pRaw.applicationId || submissionData.applicationId || 12),
          appSubId: createdSubmission.submissionId,
          amount: Number(pRaw.amount || 0),
          surcharge: pRaw.surcharge !== null && pRaw.surcharge !== undefined ? Number(pRaw.surcharge) : null,
          totalAmount: pRaw.totalAmount !== null && pRaw.totalAmount !== undefined ? Number(pRaw.totalAmount) : null,
          trnReqDate: String(pRaw.trnReqDate || new Date().toISOString()),
          statusCode: pRaw.statusCode || 'S',
          statusDescription: String(pRaw.statusDescription || 'Payment success'),
          txnMsg: String(pRaw.txnMsg || ''),
          txnStatus: String(pRaw.txnStatus || ''),
          txnErrMsg: String(pRaw.txnErrMsg || ''),
          clntTxnRef: String(pRaw.clntTxnRef || `LIVE-${createdSubmission.submissionId}`),
          clntRqstMeta: String(pRaw.clntRqstMeta || '{}'),
          worldlineMerchantTransactionId: String(
            pRaw.worldlineMerchantTransactionId || `LIVE-WL-${createdSubmission.submissionId}`
          ),
          hashToken: String(pRaw.hashToken || 'live-snapshot-hash'),
          token: String(pRaw.token || 'live-snapshot-token'),
          worldlineMerchantTransactionTime: toDate(pRaw.worldlineMerchantTransactionTime) || new Date(),
          paymentMode: pRaw.paymentMode ?? null,
          created: toDate(pRaw.created) || new Date(),
          updated: toDate(pRaw.updated),
        } as any,
      });
    }

    const mappingRows = Array.isArray(source.dmsMappings) ? source.dmsMappings : [];
    for (const mRaw of mappingRows as any[]) {
      const oldDocId = Number(mRaw.documentsId || 0);
      const mappedDocId = oldInvestorDocIdToNewId.get(oldDocId);
      if (!mappedDocId) continue;

      await prisma.applicationDmsDocumentsMapping.create({
        data: {
          iuid: BigInt(investor.investor_profile.uid),
          userId: investor.id,
          sno: BigInt(createdSp.sno),
          serviceId: '943.0',
          deptId: Number(mRaw.deptId || submissionData.deptId || 1),
          documentsId: mappedDocId,
          documentFileName: String(mRaw.documentFileName || ''),
          status: String(mRaw.status || 'U'),
          ipAddress: mRaw.ipAddress ?? null,
          userAgent: mRaw.userAgent ?? null,
          createdOn: toDate(mRaw.createdOn) || new Date(),
          lastUpdated: toDate(mRaw.lastUpdated),
          comments: mRaw.comments ?? null,
          isUploadedFlag: mRaw.isUploadedFlag !== null && mRaw.isUploadedFlag !== undefined
            ? Number(mRaw.isUploadedFlag)
            : null,
        },
      });
    }

    console.log(
      `  [OK] Seeded inprinciple live snapshot submission ${createdSubmission.submissionId} from captured data`
    );
  } catch (error) {
    console.error('  [ERROR] inprinciple live snapshot seeding failed:', error);
    throw error;
  }
}

