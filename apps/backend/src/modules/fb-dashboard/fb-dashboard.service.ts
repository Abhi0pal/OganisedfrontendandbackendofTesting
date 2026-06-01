import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkflowBuilderEngineService } from '../workflow-builder/workflow-builder-engine.service';
import { OptionSourceType, YnFlag } from '@prisma/client';
import jexl from 'jexl';

// Tab → applicationStatus codes from t_application_submission
// P=Pending, F=Forwarded, A=Approved, R=Rejected, H/RBI=Reverted
// PD=Payment Pending, DP=Demand Pending, I=Incomplete/Submitted
const TAB_STATUS_FILTER: Record<string, string[]> = {
  pending: ['P', 'PD', 'DP', 'I', 'F'],
  forwarded: ['F', 'PD', 'DP'],
  completed: ['F', 'A'],
  approved: ['A'],
  rejected: ['R'],
  reverted: ['H', 'RBI'],
  history: [], // empty = no filter (all)
};

@Injectable()
export class FbDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engineService: WorkflowBuilderEngineService,
  ) { }

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

  // ── Inbox ────────────────────────────────────────────────────────────────────
  async getInbox(options: {
    userId: bigint;
    userRoleId: number;
    tab?: string;
    serviceId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = (options.page ?? 0) > 0 ? (options.page as number) : 1;
    const limit = Math.min((options.limit ?? 0) > 0 ? (options.limit as number) : 20, 100);
    const skip = (page - 1) * limit;
    const tab = String(options.tab || '').trim().toLowerCase();

    // ── 1. Officer's dept + district from department_users ────────────────────
    const deptUser = await this.prisma.department_users.findFirst({
      where: { user_id: options.userId },
      select: { dept_id: true, district_id: true },
    });
    const actorDeptId = Number(deptUser?.dept_id || 0) || null;
    const actorDistrictId = Number(deptUser?.district_id || 0) || null;
    const actorUserId = Number(options.userId);

    // ── 2. Get all forward rows for this role (status filtering done via applicationStatus) ──
    const rawForwardRows = await this.prisma.forwardApplication.findMany({
      where: {
        nextRoleId: options.userRoleId,
        appSubId: { not: null },
      },
      select: {
        appSubId: true,
        nextUserId: true,
        forwardedDeptId: true,
        forwardedDistId: true,
        createdOn: true,
        actionStatus: true,
        approvStatus: true,
      },
      orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
    });

    // Deduplicate by appSubId in JS since Postgres DISTINCT ON requires matching leftmost ORDER BY
    const forwardRows: any[] = [];
    const seenAppSubIds = new Set<number>();
    for (const row of rawForwardRows) {
      const subId = Number(row.appSubId);
      if (!seenAppSubIds.has(subId)) {
        seenAppSubIds.add(subId);
        forwardRows.push(row);
      }
    }


    // ── 2a. V2 Workflow Engine tasks ──────────────────────────────────────────
    // Fetch all V2 rows for this role; tab filtering is handled via applicationStatus below
    const v2Rows = await this.prisma.tWorkflowForwardLevel.findMany({
      where: { currentRoleId: options.userRoleId },
      select: {
        id: true,
        applicationId: true,
        startedAt: true,
        currentProcessCode: true,
        currentProcessName: true,
        status: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 1, select: { actionCode: true, fromProcessName: true } }
      },
      orderBy: { startedAt: 'desc' },
    });

    // ── 2b. Forwarded/Completed Tab Logic (Applications acted upon by this user) ──
    let actedByMeIds: number[] = [];
    const actedV2Ids = new Set<number>();
    if (tab !== 'pending') {
      const actedRows = await this.prisma.forwardApplication.findMany({
        where: { verifierUserId: actorUserId },
        select: { appSubId: true },
        orderBy: { createdOn: 'desc' },
        take: 500, // Limit for performance
      });
      actedByMeIds = actedRows.map(r => Number(r.appSubId)).filter(id => id > 0);

      // Also check V2 history if applicable
      const actedV2Rows = await this.prisma.tWorkflowAudit.findMany({
        where: { actorUserId: BigInt(actorUserId) },
        select: { forwardLevel: { select: { applicationId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      actedV2Rows.forEach(r => {
        const id = Number(r.forwardLevel?.applicationId);
        if (id > 0) {
          actedByMeIds.push(id);
          actedV2Ids.add(id);
        }
      });
      actedByMeIds = [...new Set(actedByMeIds)];
    }

    // ── 3. Match rows to this officer (by userId OR dept+district) ────────────
    const matchedV1 = forwardRows.filter((row) =>
      this.matchAssignment(row, { actorUserId, actorDeptId, actorDistrictId, actorRoleId: options.userRoleId }),
    );

    const submissionIdsSet = new Set<number>();
    matchedV1.forEach(r => {
      const id = Number(r.appSubId);
      if (Number.isFinite(id) && id > 0) submissionIdsSet.add(id);
    });
    v2Rows.forEach(r => {
      const id = Number(r.applicationId);
      if (Number.isFinite(id) && id > 0) submissionIdsSet.add(id);
    });
    actedByMeIds.forEach(id => submissionIdsSet.add(id));

    const submissionIds = Array.from(submissionIdsSet);
    console.log(`[FB-DASHBOARD] Submission IDs to lookup:`, submissionIds);

    if (!submissionIds.length) {
      return { items: [], total: 0, page, limit, counts: { pending: 0, total: 0 } };
    }

    // ── 5. Load all submissions for this role (status filter applied AFTER resolving display status) ──
    // We cannot filter by applicationStatus in DB because the resolved/displayed status depends on
    // the forward row's approvStatus/actionStatus, which can differ from applicationStatus.
    const tabStatuses = TAB_STATUS_FILTER[tab] ?? TAB_STATUS_FILTER['pending'];
    const submissions = await this.prisma.applicationSubmission.findMany({
      where: {
        submissionId: { in: submissionIds },
        ...(options.serviceId ? { serviceId: String(options.serviceId) } : {}),
      },
      select: {
        submissionId: true,
        serviceId: true,
        unitName: true,
        fieldValue: true,
        applicationStatus: true,
        deptId: true,
        applicationUpdatedDateTime: true,
      },
    });

    const subMap = new Map(submissions.map((s) => [Number(s.submissionId), s]));

    // ── 6. Load service + department names ────────────────────────────────────
    const serviceIds = [...new Set(submissions.map((s) => s.serviceId))];
    const deptIds = [...new Set(submissions.map((s) => Number(s.deptId || 0)).filter(Boolean))];

    const [services, departments] = await Promise.all([
      serviceIds.length
        ? this.prisma.service.findMany({ where: { service_id: { in: serviceIds } }, select: { service_id: true, service_name: true } })
        : [] as { service_id: string; service_name: string | null }[],
      deptIds.length
        ? this.prisma.masterData.findMany({ where: { id: { in: deptIds.map(id => BigInt(id)) } }, select: { id: true, data: true } })
        : [] as { id: bigint; data: any }[],
    ]);

    const serviceMap = new Map<string, string>(services.map((s) => [s.service_id, s.service_name || s.service_id] as [string, string]));
    const deptMap = new Map<number, string>(departments.map((d) => {
      const data = (d.data || {}) as Record<string, any>;
      const name = data.name || data.Name || data.label || data.title || `Dept ${d.id}`;
      return [Number(d.id), name] as [number, string];
    }));

    // ── 7. Build result rows ──────────────────────────────────────────────────
    const combinedMap = new Map<number, any>();

    // V1 entries
    matchedV1.forEach((fwd) => {
      const subId = Number(fwd.appSubId);
      const sub = subMap.get(subId);
      if (!sub) return;
      const resolvedStatus = this.resolveInboxStatusFromForward(
        fwd.approvStatus,
        fwd.actionStatus,
        sub.applicationStatus,
      );
      combinedMap.set(subId, {
        id: subId,
        submissionId: subId,
        serviceId: sub.serviceId,
        serviceName: serviceMap.get(sub.serviceId) || sub.serviceId,
        unitName: this.getDisplayUnitName(sub.unitName, sub.fieldValue, sub.submissionId),
        investorName: this.extractApplicantName(sub.fieldValue),
        department: deptMap.get(Number(sub.deptId || 0)) || 'N/A',
        receivedDate: fwd.createdOn || sub.applicationUpdatedDateTime,
        status: resolvedStatus,
        statusLabel: this.friendlyStatus(resolvedStatus),
        actionUrl: `/department/workflow/${sub.submissionId}`,
        dueAt: null,
        slaBreached: false,
      });
    });

    // V2 entries (override V1 if both exist)
    const v2TaskMap = new Map<number, any>();
    v2Rows.forEach(r => v2TaskMap.set(Number(r.applicationId), r));

    v2Rows.forEach((v2) => {
      const subId = Number(v2.applicationId);
      const sub = subMap.get(subId);
      if (!sub) return;
      const workflowStatus = this.resolveInboxStatusFromWorkflowTask(
        v2,
        sub.applicationStatus,
        true // isCurrentActor
      );
      combinedMap.set(subId, {
        id: subId,
        submissionId: subId,
        serviceId: sub.serviceId,
        serviceName: serviceMap.get(sub.serviceId) || sub.serviceId,
        unitName: this.getDisplayUnitName(sub.unitName, sub.fieldValue, sub.submissionId),
        investorName: this.extractApplicantName(sub.fieldValue),
        department: deptMap.get(Number(sub.deptId || 0)) || 'N/A',
        receivedDate: v2.startedAt || sub.applicationUpdatedDateTime,
        status: workflowStatus.status,
        statusLabel: workflowStatus.label,
        actionUrl: `/department/workflow-v2/${sub.submissionId}`,
        dueAt: null,
        slaBreached: false,
      });
    });

    // Fetch V2 states for historical acted items to resolve their status correctly
    const actedV2IdsToFetch = Array.from(actedV2Ids).filter(id => !v2TaskMap.has(id));
    if (actedV2IdsToFetch.length > 0) {
      const actedV2TaskRows = await this.prisma.tWorkflowForwardLevel.findMany({
        where: { applicationId: { in: actedV2IdsToFetch.map(id => BigInt(id)) } },
        select: { applicationId: true, status: true, currentProcessName: true, auditLogs: { orderBy: { createdAt: 'desc' }, take: 1, select: { actionCode: true, fromProcessName: true } } }
      });
      actedV2TaskRows.forEach(r => v2TaskMap.set(Number(r.applicationId), r));
    }

    // ACTED BY ME entries (if not already handled by v1/v2 pending)
    actedByMeIds.forEach((id) => {
      if (combinedMap.has(id)) return;
      const sub = subMap.get(id);
      if (!sub) return;

      const isV2 = actedV2Ids.has(id);
      let rowStatus = String(sub.applicationStatus || 'P').trim().toUpperCase();
      let rowLabel = this.friendlyStatus(sub.applicationStatus);

      if (isV2) {
        const v2Task = v2TaskMap.get(id);
        if (v2Task) {
          const ws = this.resolveInboxStatusFromWorkflowTask(v2Task, sub.applicationStatus, false);
          rowStatus = ws.status;
          rowLabel = ws.label;
        }
      }

      combinedMap.set(id, {
        id,
        submissionId: id,
        serviceId: sub.serviceId,
        serviceName: serviceMap.get(sub.serviceId) || sub.serviceId,
        unitName: this.getDisplayUnitName(sub.unitName, sub.fieldValue, sub.submissionId),
        investorName: this.extractApplicantName(sub.fieldValue),
        department: deptMap.get(Number(sub.deptId || 0)) || 'N/A',
        receivedDate: sub.applicationUpdatedDateTime,
        status: rowStatus,
        statusLabel: rowLabel,
        actionUrl: isV2 ? `/department/workflow-v2/${sub.submissionId}` : `/department/workflow/${sub.submissionId}`,
        dueAt: null,
        slaBreached: false,
      });
    });

    let rows = Array.from(combinedMap.values());

    // Apply tab filter on the RESOLVED display status (not raw applicationStatus from DB)
    // This ensures pending tab shows only rows whose resolved status is 'P', etc.
    if (tabStatuses.length > 0) {
      rows = rows.filter((row) => tabStatuses.includes(String(row.status || '').trim().toUpperCase()));
    }

    // Sort combined rows by date descending
    rows.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());

    const total = rows.length;
    const items = rows.slice(skip, skip + limit);

    return { items, total, page, limit, counts: { pending: total, total } };
  }

  // ── Application View (with field schema) ─────────────────────────────────
  async getApplicationView(submissionId: number) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: {
        submissionId: true,
        serviceId: true,
        formId: true,
        unitName: true,
        fieldValue: true,
        applicationStatus: true,
        deptId: true,
        applicationUpdatedDateTime: true,
        applicationCreatedDate: true,
      },
    });
    console.log('[DEBUG] getApplicationView sub:', submissionId, 'serviceId:', submission?.serviceId, 'formId:', submission?.formId);
    if (!submission) throw new Error('Submission not found');

    // Fetch form builder fields with labels + categories
    const builderFields = await this.prisma.formBuilderField.findMany({
      where: {
        service_id: submission.serviceId,
        ...(submission.formId ? { form_id: submission.formId } : {}),
        is_active: 'Y',
      },
      include: {
        formField: { include: { category: true } },
        optionConfig: true,
      },
      orderBy: [{ preference: 'asc' }],
    });

    // Fetch page and category ordering to match investor form layout
    const pageIds = [...new Set(builderFields.map(f => f.page_id).filter(Boolean))];
    const [pageMasters, categoryMappings] = await Promise.all([
      this.prisma.formPageMaster.findMany({
        where: { id: { in: pageIds as number[] } },
        select: { id: true, preference: true },
      }),
      this.prisma.formPageCategoryMapping.findMany({
        where: { page_id: { in: pageIds as number[] }, is_active: 'Y' },
        select: { page_id: true, category_id: true, preference: true },
      }),
    ]);

    const pagePreferenceMap = new Map(pageMasters.map(p => [p.id, p.preference]));
    const catMappingKey = (pageId: number, catId: number) => `${pageId}:${catId}`;
    const catPreferenceMap = new Map(
      categoryMappings.map(cm => [catMappingKey(cm.page_id, cm.category_id), cm.preference])
    );

    // Fetch category names for mapping
    const categoryIds = [...new Set(builderFields.map(f => f.category_id).filter(Boolean))];
    const categoryMasters = await this.prisma.formCategory.findMany({
      where: { id: { in: categoryIds as number[] } },
      select: { id: true, categoryName: true, categoryCode: true },
    });
    const categoryMap = new Map(categoryMasters.map(c => [c.id, c]));

    // Build field schema with global sort key: pagePreference → categoryPreference → fieldPreference
    const fieldSchema = builderFields
      .filter((f) => f.formField?.formCheckId)
      .map((f) => {
        const pagePref = pagePreferenceMap.get(f.page_id) ?? 999;
        const catPref = catPreferenceMap.get(catMappingKey(f.page_id, f.category_id)) ?? 999;
        const fieldPref = f.preference || 0;
        const globalOrder = pagePref * 100000 + catPref * 1000 + fieldPref;

        const cat = categoryMap.get(f.category_id);

        let label = f.custom_label || f.formField!.name || f.formField!.formCheckId;

        // If it's a checkbox (declaration), try to get the full statement from static options
        if (f.input_type === 'checkbox' && f.optionConfig?.static_options) {
          const options = f.optionConfig.static_options as any[];
          if (Array.isArray(options) && options.length > 0 && options[0].label) {
            // Use the longer text (the statement) as the label
            if (options[0].label.length > label.length || label.toLowerCase() === 'declaration') {
              label = options[0].label;
            }
          }
        }

        return {
          fieldCode: f.formField!.formCheckId,
          label,
          categoryCode: cat?.categoryCode ?? f.formField?.category?.categoryCode ?? null,
          categoryName: cat?.categoryName ?? f.formField?.category?.categoryName ?? 'General',
          inputType: f.input_type,
          gridSpan: f.gridSpan || 12,
          preference: globalOrder,
        };
      })
      .sort((a, b) => a.preference - b.preference)
      .filter((f, _i, arr) => arr.findIndex(x => x.fieldCode === f.fieldCode) === _i);

    // Load service name
    const service = await this.prisma.service.findUnique({
      where: { service_id: submission.serviceId },
      select: { service_name: true },
    });

    const resolvedFormData = await this.resolveDisplayFormData(
      (submission.fieldValue || {}) as Record<string, unknown>,
      builderFields,
    );

    return {
      submissionId: Number(submission.submissionId),
      status: String(submission.applicationStatus || 'P').toUpperCase(),
      statusLabel: this.friendlyStatus(submission.applicationStatus),
      serviceId: submission.serviceId,
      serviceName: service?.service_name || submission.serviceId,
      unitName: this.getDisplayUnitName(submission.unitName, submission.fieldValue, submission.submissionId),
      formData: resolvedFormData,
      fieldSchema,
      createdDate: submission.applicationCreatedDate,
      updatedDate: submission.applicationUpdatedDateTime,
    };
  }

  // ── Print Data (application view + photo) ────────────────────────────────
  async getPrintData(submissionId: number) {
    const base = await this.getApplicationView(submissionId);

    // Fetch photo: check submission.image first, else look in InvestorDocument
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { image: true, userId: true },
    });

    let photoUrl: string | null = null;

    // 1. submission.image may hold base64 or relative path
    if (submission?.image) {
      const img = String(submission.image).trim();
      photoUrl = img.startsWith('data:') || img.startsWith('http') ? img : `/${img.replace(/^\//, '')}`;
    }

    // 2. Fallback: find "photo" document from InvestorDocument via userId → investor_profile
    if (!photoUrl && submission?.userId) {
      const profile = await this.prisma.investor_profiles.findFirst({
        where: { user_id: submission.userId },
        select: { uid: true },
      });
      if (profile?.uid) {
        const photoDoc = await this.prisma.investorDocument.findFirst({
          where: {
            investorProfileUid: profile.uid,
            isDocumentActive: 'Y',
            documentMaster: {
              checklistDocumentName: { contains: 'photo', mode: 'insensitive' },
            },
          },
          select: { documentPath: true, documentName: true },
          orderBy: { createdAt: 'desc' },
        });
        if (photoDoc?.documentPath) {
          photoUrl = `/${photoDoc.documentPath.replace(/^\//, '')}`;
        }
      }
    }

    return { ...base, photoUrl };
  }

  // ── Timeline ─────────────────────────────────────────────────────────────
  async getFbTimeline(submissionId: number) {
    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(submissionId) },
      select: { sno: true },
    });

    // Fetch history ascending for time calculation, then reverse for display
    const history = await this.prisma.applicationHistory.findMany({
      where: spApp?.sno
        ? { sno: spApp.sno }
        : { appId: String(submissionId) },
      orderBy: { historyId: 'asc' },
    });

    if (!history.length) return [];

    // Collect roleIds from actor + nextRoleId
    const roleIds = new Set<number>();
    history.forEach((item) => {
      const rid = Number(item.roleId || 0);
      const nrid = Number(item.nextRoleId || 0);
      if (rid > 0) roleIds.add(rid);
      if (nrid > 0) roleIds.add(nrid);
    });

    // Fetch action master codes → full names
    const [roleRows, actionRows] = await Promise.all([
      roleIds.size
        ? this.prisma.roles.findMany({
          where: { id: { in: Array.from(roleIds) } },
          select: { id: true, name: true },
        })
        : Promise.resolve([] as { id: number; name: string | null }[]),
      this.prisma.workflowActionMaster.findMany({
        select: { code: true, name: true },
      }),
    ]);

    const roleMap = new Map<number, string>(
      roleRows.map((r) => [Number(r.id), String(r.name || '')] as const),
    );
    const actionMap = new Map<string, string>(
      actionRows.map((a) => [String(a.code).toUpperCase(), a.name] as const),
    );

    // Time tracking helpers
    const applicantTransitions = new Set(['I|DP', 'DP|PD', 'PD|I', 'I|P', 'RBI|I']);
    const deptTransitions = new Set(['P|F', 'F|FA', 'F|A', 'F|R', 'F|RBI', 'P|RBI']);
    const getStatus = (item: (typeof history)[number]) =>
      String(item.applicationStatus || '').toUpperCase();

    let totalApplicant = 0, totalDept = 0, totalLine = 0;

    // Build rows in ascending order (for time calc), latest will be shown first on frontend
    const rows: any[] = [];
    history.forEach((item, idx) => {
      const next = history[idx + 1] ?? null;
      const seconds = next
        ? Math.abs(item.addedDateTime.getTime() - next.addedDateTime.getTime()) / 1000
        : 0;

      const roleId = Number(item.roleId || 0);
      const roleName = roleMap.get(roleId) || String(item.roleName || '').trim() || '—';
      const key = `${getStatus(item)}|${next ? getStatus(next) : ''}`;

      // Classify time
      let applicantSec = 0, deptSec = 0, lineSec = 0;
      if (roleId === 3) lineSec = seconds;
      else if (roleId === 7 || roleId === 33) deptSec = seconds;
      else if (roleName.toLowerCase().includes('investor') || roleId === -1)
        applicantSec = seconds;
      else {
        applicantSec = applicantTransitions.has(key) ? seconds : 0;
        deptSec = deptTransitions.has(key) ? seconds : 0;
      }

      totalApplicant += applicantSec;
      totalDept += deptSec;
      totalLine += lineSec;

      // Action type: look up full name from action master using applicationStatus code
      const statusCode = String(item.applicationStatus || '').toUpperCase();
      const actionType = actionMap.get(statusCode) || this.friendlyStatus(item.applicationStatus);

      // Forwarded To: resolve nextRoleId to role name
      const forwardedTo = roleMap.get(Number(item.nextRoleId || 0)) || '—';

      rows.push({
        sequence: idx + 1,
        actionTakenBy: roleName,
        actionTakenOn: item.addedDateTime,
        actionType,
        comments: item.comments || '',
        forwardedTo,
        timeTakenByApplicantSeconds: applicantSec,
        timeTakenByDepartmentSeconds: deptSec,
        timeTakenByLineDepartmentSeconds: lineSec,
      });
    });

    // re-number sequence in natural ascending order
    rows.forEach((r, i) => { r.sequence = i + 1; });

    // Totals row at bottom
    rows.push({
      sequence: rows.length + 1,
      actionTakenBy: '',
      actionTakenOn: new Date(0),
      actionType: 'TOTAL',
      comments: 'Total',
      forwardedTo: '',
      timeTakenByApplicantSeconds: totalApplicant,
      timeTakenByDepartmentSeconds: totalDept,
      timeTakenByLineDepartmentSeconds: totalLine,
    });

    return rows;
  }

  // ── Officer Form (role-specific form from form builder) ─────────────────
  async getOfficerForm(submissionId: number, roleId: number, officerUserId?: number) {
    // Fetch submission and officer context
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { serviceId: true },
    });
    if (!submission) throw new Error('Submission not found');

    const officer = officerUserId ? await this.prisma.users.findUnique({
      where: { id: BigInt(officerUserId) },
      select: { tenant_id: true, project_id: true }
    }) : null;

    // 1. Check for V2 Workflow Task first
    const v2Task = await this.prisma.tWorkflowForwardLevel.findFirst({
      where: {
        applicationId: BigInt(submissionId),
        currentRoleId: roleId,
        status: 'ACTIVE',
      },
      include: {
        process: {
          select: {
            id: true,
            formTypeId: true,
            name: true,
            actions: { orderBy: { displayOrder: 'asc' } },
          },
        },
      },
    });

    if (v2Task) {
      let processJson: any = null;
      if (v2Task.configId) {
        const config = await this.prisma.workflowConfiguration.findUnique({
          where: { id: v2Task.configId },
          select: { configuration: true },
        });
        if (config && config.configuration) {
          const cfg = config.configuration as any;
          processJson = cfg.processes?.find((p: any) => p.processCode === v2Task.currentProcessCode);
        }
      }

      const formTypeId = processJson?.formTypeId ?? v2Task.process?.formTypeId ?? 0;
      const processName = processJson?.name ?? v2Task.currentProcessName ?? v2Task.process?.name ?? 'Action';

      // 1. Specificity Ladder: User > Role > Tenant > Global (within current service)
      let builderFields: any[] = [];
      const commonWhere = {
        service_id: submission.serviceId,
        form_id: formTypeId,
        is_active: YnFlag.Y,
      };

      // Try User Specific
      if (officerUserId) {
        builderFields = await this.prisma.formBuilderField.findMany({
          where: { ...commonWhere, user_id: Number(officerUserId) },
          include: {
            formField: { include: { category: true } },
            optionConfig: true,
            addMoreGroups: {
              include: {
                columns: { include: { builderField: { include: { formField: true } } } }
              }
            }
          },
          orderBy: { preference: 'asc' }
        });
      }

      // Try Role Specific
      if (builderFields.length === 0 && roleId) {
        builderFields = await this.prisma.formBuilderField.findMany({
          where: { ...commonWhere, role_id: Number(roleId) },
          include: {
            formField: { include: { category: true } },
            optionConfig: true,
            addMoreGroups: {
              include: {
                columns: { include: { builderField: { include: { formField: true } } } }
              }
            }
          },
          orderBy: { preference: 'asc' }
        });
      }

      // Try Tenant/Global Fallback (in current service)
      if (builderFields.length === 0) {
        builderFields = await this.prisma.formBuilderField.findMany({
          where: {
            ...commonWhere,
            role_id: null,
            OR: [
              { tenant_id: officer?.tenant_id ? Number(officer?.tenant_id) : undefined },
              { tenant_id: null }
            ]
          },
          include: {
            formField: { include: { category: true } },
            optionConfig: true,
            addMoreGroups: {
              include: {
                columns: { include: { builderField: { include: { formField: true } } } }
              }
            }
          },
          orderBy: { preference: 'asc' }
        });
      }

      // 2. Cross-Service Fallback: Only if the current service has NO configuration at all
      if (builderFields.length === 0) {
        // Try to find ANY service that has a Role-specific form for this role
        builderFields = await this.prisma.formBuilderField.findMany({
          where: {
            form_id: formTypeId,
            role_id: Number(roleId),
            is_active: YnFlag.Y,
          },
          include: { formField: true }, orderBy: { preference: 'asc' },
          take: 100
        });

        if (builderFields.length > 0) {
          // Group and pick the first alternative service found
          const serviceGroups = new Map<string, any[]>();
          for (const f of builderFields) {
            if (!serviceGroups.has(f.service_id)) serviceGroups.set(f.service_id, []);
            serviceGroups.get(f.service_id)!.push(f);
          }
          const firstAltService = Array.from(serviceGroups.keys())[0];
          builderFields = serviceGroups.get(firstAltService) || [];
        }
      }

      const finalFields = builderFields.sort((a, b) => (a.preference || 0) - (b.preference || 0));

      // Filter out fields that are part of an 'Add More' group columns (they should not be shown as standalone)
      const childFieldIds = new Set<number>();
      finalFields.forEach(bf => {
        bf.addMoreGroups?.forEach((g: any) => {
          g.columns?.forEach((c: any) => {
            if (c.builder_field_id) childFieldIds.add(Number(c.builder_field_id));
          });
        });
      });
      const filteredFields = finalFields.filter(bf => !childFieldIds.has(bf.id));

      const categoryMap = new Map<number, any>();

      // Initialize categoryMap entries in the order they first appear in the unfiltered finalFields list
      // This ensures that category order is preserved even if the first field of a category is filtered out.
      finalFields.forEach(bf => {
        if (!categoryMap.has(bf.category_id)) {
          const categoryName = bf.formField?.category?.categoryName || `Section ${bf.category_id}`;
          categoryMap.set(bf.category_id, {
            categoryCode: String(bf.category_id),
            categoryName: categoryName,
            fields: []
          });
        }
      });

      for (const bf of filteredFields) {
        let label = bf.custom_label || bf.formField?.name || `field_${bf.id}`;
        if (bf.input_type === 'checkbox' && bf.optionConfig?.static_options) {
          const options = bf.optionConfig.static_options as any[];
          if (Array.isArray(options) && options.length > 0 && options[0].label) {
            if (options[0].label.length > label.length || label.toLowerCase() === 'declaration') {
              label = options[0].label;
            }
          }
        }

        categoryMap.get(bf.category_id).fields.push({
          fieldCode: bf.formField?.formCheckId || `field_${bf.id}`,
          label,
          inputType: bf.input_type,
          placeholder: bf.placeholder,
          isRequired: bf.is_required === YnFlag.Y,
          isReadonly: bf.is_readonly === YnFlag.Y,
          gridSpan: bf.gridSpan || 12,
          preference: bf.preference || 0,
          helpText: bf.help_text,
          addMoreGroups: bf.addMoreGroups?.map((g: any) => ({
            id: g.id,
            label: g.label,
            minRows: g.min_rows,
            maxRows: g.max_rows,
            columns: g.columns?.map((c: any) => ({
              fieldCode: c.builderField?.formField?.formCheckId,
              label: c.builderField?.custom_label || c.builderField?.formField?.name,
              inputType: c.builderField?.input_type,
              isRequired: c.builderField?.is_required === YnFlag.Y,
              isReadonly: c.builderField?.is_readonly === YnFlag.Y,
              placeholder: c.builderField?.placeholder,
              gridSpan: c.builderField?.gridSpan || 4,
              preference: c.builderField?.preference || 0,
            }))
          }))
        });
      }

      // Add Actions from JSON
      const actions = processJson?.actions || (v2Task as any).process?.actions || [];
      console.log(`[FB-DASHBOARD] getOfficerForm for sub ${submissionId}, role ${roleId}: Available actions:`, actions.map((a: any) => a.actionCode));
      if (actions.length > 0) {
        const actionFields = actions.map((a: any) => ({
          fieldCode: a.actionCode,
          label: a.actionLabel || a.name || a.actionCode,
          inputType: 'button',
          isRequired: false,
          isReadonly: false,
          gridSpan: 12,
          payload: a.payload,
        }));
        categoryMap.set(999, {
          categoryCode: 'actions',
          categoryName: 'Actions',
          fields: actionFields,
        });
      }

      // Fetch Payment Info
      const payment = await this.prisma.paymentDetail.findFirst({
        where: { applicationId: submissionId },
        orderBy: { created: 'desc' }
      });

      return {
        formName: processName,
        formTypeId,
        step: v2Task.forwardLevel,
        allowPaymentDemand: !!processJson?.allowPaymentDemand,
        categories: Array.from(categoryMap.values()).filter(c => c.fields.length > 0),
        paymentDetails: payment ? {
          paymentId: Number(payment.paymentId),
          amount: payment.amount,
          statusCode: payment.statusCode,
          txnStatus: payment.txnStatus,
          created: payment.created.toISOString(),
          bifurcationDetails: payment.bifurcationDetails as any[],
        } : null,
      };
    }

    // --- Fallback to V1 Logic ---
    // submission already loaded at top

    // Find Mapping (Type 2 preferred for officers)
    const mapping = await this.prisma.formMapping.findFirst({
      where: {
        service_id: submission.serviceId,
        form_type_id: 2,
        is_active: YnFlag.Y,
        OR: [
          { user_id: officerUserId ? Number(officerUserId) : null },
          { role_id: roleId, user_id: null },
          { tenant_id: officer?.tenant_id, project_id: officer?.project_id, role_id: null, user_id: null },
          { tenant_id: officer?.tenant_id, project_id: null, role_id: null, user_id: null },
          { tenant_id: null, project_id: null, role_id: null, user_id: null }
        ]
      },
      orderBy: [
        { user_id: { sort: 'desc', nulls: 'last' } as any },
        { role_id: { sort: 'desc', nulls: 'last' } as any },
        { project_id: { sort: 'desc', nulls: 'last' } as any },
        { tenant_id: { sort: 'desc', nulls: 'last' } as any }
      ]
    });

    let activeFormTypeId = mapping?.form_type_id ?? null;
    let formName = mapping?.form_name ?? null;

    if (!mapping) {
      const wfConfig = await this.prisma.applicationWorkflowConfiguration.findFirst({
        where: { serviceId: submission.serviceId, roleId },
        select: { formTypeId: true },
        orderBy: { step: 'asc' },
      }) || await this.prisma.applicationWorkflowConfiguration.findFirst({
        where: { serviceId: submission.serviceId, currentRoleId: roleId },
        select: { formTypeId: true },
        orderBy: { step: 'asc' },
      });
      activeFormTypeId = wfConfig?.formTypeId ?? null;
    }

    if (!activeFormTypeId) {
      return { formName: null, formTypeId: null, categories: [] };
    }

    // 1. Try Current Service (Specificity Ladder)
    let builderFields: any[] = [];
    const commonWhere = {
      service_id: submission.serviceId,
      form_id: activeFormTypeId,
      is_active: YnFlag.Y,
    };

    if (officerUserId) {
      builderFields = await this.prisma.formBuilderField.findMany({
        where: { ...commonWhere, user_id: Number(officerUserId) },
        include: {
          formField: { include: { category: true } },
          optionConfig: true,
          addMoreGroups: {
            include: {
              columns: { include: { builderField: { include: { formField: true } } } }
            }
          }
        },
        orderBy: { preference: 'asc' }
      });
    }

    if (builderFields.length === 0 && roleId) {
      builderFields = await this.prisma.formBuilderField.findMany({
        where: { ...commonWhere, role_id: Number(roleId) },
        include: {
          formField: { include: { category: true } },
          optionConfig: true,
          addMoreGroups: {
            include: {
              columns: { include: { builderField: { include: { formField: true } } } }
            }
          }
        },
        orderBy: { preference: 'asc' }
      });
    }

    if (builderFields.length === 0) {
      builderFields = await this.prisma.formBuilderField.findMany({
        where: {
          ...commonWhere,
          role_id: null,
          OR: [
            { tenant_id: officer?.tenant_id ? Number(officer?.tenant_id) : undefined },
            { tenant_id: null }
          ]
        },
        include: {
          formField: { include: { category: true } },
          optionConfig: true,
          addMoreGroups: {
            include: {
              columns: { include: { builderField: { include: { formField: true } } } }
            }
          }
        },
        orderBy: { preference: 'asc' }
      });
    }

    // 2. Cross-Service Fallback
    if (builderFields.length === 0) {
      builderFields = await this.prisma.formBuilderField.findMany({
        where: {
          form_id: activeFormTypeId,
        },
        include: { formField: true },
        orderBy: { preference: 'asc' },
        take: 100,
      });

      const serviceGroups = new Map<string, any[]>();
      for (const f of builderFields) {
        if (!serviceGroups.has(f.service_id)) serviceGroups.set(f.service_id, []);
        serviceGroups.get(f.service_id)!.push(f);
      }
      const firstAltService = Array.from(serviceGroups.keys())[0];
      builderFields = serviceGroups.get(firstAltService) || [];
    }

    const finalFields = builderFields.sort((a, b) => (a.preference || 0) - (b.preference || 0));

    // Filter out fields that are part of an 'Add More' group columns (they should not be shown as standalone)
    const childFieldIds = new Set<number>();
    finalFields.forEach(bf => {
      bf.addMoreGroups?.forEach((g: any) => {
        g.columns?.forEach((c: any) => {
          if (c.builder_field_id) childFieldIds.add(Number(c.builder_field_id));
        });
      });
    });
    const filteredFields = finalFields.filter(bf => !childFieldIds.has(bf.id));

    const categoryMap = new Map<number, any>();

    // Initialize categoryMap entries in the order they first appear in the unfiltered finalFields list
    finalFields.forEach(bf => {
      if (!categoryMap.has(bf.category_id)) {
        const categoryName = bf.formField?.category?.categoryName || `Section ${bf.category_id}`;
        categoryMap.set(bf.category_id, {
          categoryCode: String(bf.category_id),
          categoryName: categoryName,
          fields: []
        });
      }
    });

    for (const bf of filteredFields) {
      let label = bf.custom_label || bf.formField?.name || `field_${bf.id}`;
      if (bf.input_type === 'checkbox' && bf.optionConfig?.static_options) {
        const options = bf.optionConfig.static_options as any[];
        if (Array.isArray(options) && options.length > 0 && options[0].label) {
          if (options[0].label.length > label.length || label.toLowerCase() === 'declaration') {
            label = options[0].label;
          }
        }
      }

      categoryMap.get(bf.category_id).fields.push({
        ...bf.formField,
        label,
        placeholder: bf.placeholder,
        is_required: bf.is_required === YnFlag.Y,
        is_readonly: bf.is_readonly === YnFlag.Y,
        gridSpan: bf.gridSpan || 12,
        preference: bf.preference || 0,
        helpText: bf.help_text,
        addMoreGroups: bf.addMoreGroups?.map((g: any) => ({
          id: g.id,
          label: g.label,
          minRows: g.min_rows,
          maxRows: g.max_rows,
          columns: g.columns?.map((c: any) => ({
            fieldCode: c.builderField?.formField?.formCheckId,
            label: c.builderField?.custom_label || c.builderField?.formField?.name,
            inputType: c.builderField?.input_type,
            isRequired: c.builderField?.is_required === YnFlag.Y,
            isReadonly: c.builderField?.is_readonly === YnFlag.Y,
            placeholder: c.builderField?.placeholder,
            gridSpan: c.builderField?.gridSpan || 4,
            preference: c.builderField?.preference || 0,
          }))
        }))
      });
    }

    return {
      formName,
      formTypeId: activeFormTypeId,
      categories: Array.from(categoryMap.values()).filter(c => c.fields.length > 0),
    };
  }


  // ── Document Verification ─────────────────────────────────────────────────
  async getDocumentVerification(submissionId: number, roleId: number) {
    // 1. Get serviceId for this submission
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { serviceId: true, fieldValue: true },
    });
    if (!submission) throw new Error('Submission not found');

    // Keep document verify/reject controls enabled in checklist rows.
    const enabled = true;

    // 3. Get sno from t_sp_applications via app_id
    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(submissionId) },
      select: { sno: true },
    });

    if (!spApp?.sno) return { enabled, documents: [] };

    // 4. Get uploaded documents from t_application_dms_documents_mapping
    const docs = await this.prisma.applicationDmsDocumentsMapping.findMany({
      where: { sno: BigInt(spApp.sno) },
      orderBy: { createdOn: 'asc' },
    });

    if (!docs.length) return { enabled, documents: [] };

    // 5. Resolve uploaded investor documents first. `documentsId` stores InvestorDocument.id,
    // not DocumentMaster.id, so joining directly to document master gives wrong names.
    const investorDocIds = [...new Set(docs.map((d) => Number(d.documentsId)).filter(Number.isFinite))];
    const investorDocs = await this.prisma.investorDocument.findMany({
      where: { id: { in: investorDocIds } },
      select: {
        id: true,
        documentMasterId: true,
        documentName: true,
        documentPath: true,
        documentVersion: true,
        createdAt: true,
      },
    });
    const investorDocMap = new Map(investorDocs.map((doc) => [Number(doc.id), doc]));

    const latestMappingByMasterId = new Map<number, (typeof docs)[number]>();
    for (const mapping of docs) {
      const investorDoc = investorDocMap.get(Number(mapping.documentsId));
      const masterId = Number(investorDoc?.documentMasterId || 0);
      if (!masterId) continue;

      const existingMapping = latestMappingByMasterId.get(masterId);
      if (!existingMapping) {
        latestMappingByMasterId.set(masterId, mapping);
        continue;
      }

      const existingInvestorDoc = investorDocMap.get(Number(existingMapping.documentsId));
      const currentParts = this.getVersionParts(investorDoc?.documentVersion);
      const existingParts = this.getVersionParts(existingInvestorDoc?.documentVersion);

      if (
        currentParts.major > existingParts.major ||
        (currentParts.major === existingParts.major &&
          currentParts.minor > existingParts.minor)
      ) {
        latestMappingByMasterId.set(masterId, mapping);
        continue;
      }

      if (
        currentParts.major === existingParts.major &&
        currentParts.minor === existingParts.minor
      ) {
        const currentCreatedAt = investorDoc?.createdAt ? new Date(investorDoc.createdAt).getTime() : 0;
        const existingCreatedAt = existingInvestorDoc?.createdAt ? new Date(existingInvestorDoc.createdAt).getTime() : 0;
        const currentMappedAt = mapping?.createdOn ? new Date(mapping.createdOn).getTime() : 0;
        const existingMappedAt = existingMapping?.createdOn ? new Date(existingMapping.createdOn).getTime() : 0;

        if (
          currentCreatedAt > existingCreatedAt ||
          (currentCreatedAt === existingCreatedAt && currentMappedAt > existingMappedAt)
        ) {
          latestMappingByMasterId.set(masterId, mapping);
        }
      }
    }

    const latestDocs = Array.from(latestMappingByMasterId.values()).sort((a, b) => {
      const left = a?.createdOn ? new Date(a.createdOn).getTime() : 0;
      const right = b?.createdOn ? new Date(b.createdOn).getTime() : 0;
      return left - right;
    });

    // 6. Prefer service-specific DMS checklist names when available.
    const service = await this.prisma.service.findFirst({
      where: { service_id: submission.serviceId },
      select: { dms: true },
    });
    const checklistNameByMasterId = new Map<number, string>();
    const dms = typeof service?.dms === 'string' ? JSON.parse(service.dms) : service?.dms;
    const documentTypes = Array.isArray(dms?.documentTypes) ? dms.documentTypes : [];
    for (const type of documentTypes) {
      const checklists = Array.isArray(type?.checklists) ? type.checklists : [];
      for (const checklist of checklists) {
        const checklistId = Number(checklist?.id);
        const checklistName = String(checklist?.name || '').trim();
        if (Number.isFinite(checklistId) && checklistName) {
          checklistNameByMasterId.set(checklistId, checklistName);
        }
      }
    }

    // 7. Fallback to document master names if service DMS name is unavailable.
    const masterIds = [...new Set(investorDocs.map((doc) => Number(doc.documentMasterId)).filter(Number.isFinite))];
    const masters = await this.prisma.documentMaster.findMany({
      where: { id: { in: masterIds } },
      select: { id: true, checklistDocumentName: true },
    });
    const masterMap = new Map(masters.map((m) => [Number(m.id), m.checklistDocumentName]));

    const dmsDocs = latestDocs.map((d) => ({
      mappingId: d.mappingId,
      documentName: (() => {
        const investorDoc = investorDocMap.get(Number(d.documentsId));
        const masterId = Number(investorDoc?.documentMasterId || 0);
        return (
          checklistNameByMasterId.get(masterId) ||
          masterMap.get(masterId) ||
          `Document #${d.documentsId}`
        );
      })(),
      fileName: d.documentFileName,
      status: d.status || 'U',
      statusLabel: d.status === 'V' ? 'Verified' : d.status === 'M' ? 'Mismatch' : 'Un-Verified',
      comments: d.comments || '',
      fileUrl: (() => {
        const investorDoc = investorDocMap.get(Number(d.documentsId));
        if (investorDoc?.documentPath) return `/${String(investorDoc.documentPath).replace(/^\/+/, '')}`;
        return d.documentFileName ? `/uploads/investorDocuments/${d.iuid}/${d.documentFileName}` : null;
      })(),
    }));

    // 8. Automatically surface documents from form-builder fieldValue
    // First, get field labels for this service to provide human-readable document names
    const builderFields = await this.prisma.formBuilderField.findMany({
      where: { service_id: submission.serviceId, is_active: 'Y' },
      select: { formField: { select: { formCheckId: true, name: true } }, custom_label: true },
    });
    const labelLookup = new Map<string, string>();
    builderFields.forEach(f => {
      const code = f.formField?.formCheckId;
      if (code) {
        labelLookup.set(code, f.custom_label || f.formField?.name || code);
      }
    });

    const formDocs: any[] = [];
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      // If node has filePath, it's a file object from form-builder
      if (node.filePath && (node.fileName || node.originalName)) {
        const code = node.fieldCode || '';
        formDocs.push({
          mappingId: 0,
          documentName: labelLookup.get(code) || node.label || code || 'Form Attachment',
          fileName: node.fileName || node.originalName,
          status: 'U',
          statusLabel: 'Form Attachment',
          comments: '',
          fileUrl: `/${String(node.filePath).replace(/^\/+/, '')}`,
        });
        return;
      }
      Object.values(node).forEach(visit);
    };
    visit(submission.fieldValue || {});

    // Filter out formDocs that are already in dmsDocs to avoid duplication
    const existingUrls = new Set(dmsDocs.map(d => d.fileUrl).filter(Boolean));
    const filteredFormDocs = formDocs.filter(fd => !existingUrls.has(fd.fileUrl));

    return {
      enabled,
      documents: [...dmsDocs, ...filteredFormDocs],
    };
  }

  async verifyDocument(options: {
    mappingId: number;
    status: string;
    comments: string;
    deptUserId: number;
  }) {
    const { mappingId, status, comments, deptUserId } = options;

    await this.prisma.applicationDmsDocumentsMapping.update({
      where: { mappingId },
      data: { status, comments, lastUpdated: new Date() },
    });

    await this.prisma.applicationDmsDocumentsMappingLog.create({
      data: {
        mappingId: BigInt(mappingId),
        documentsId: BigInt(0),
        status,
        deptUserId,
        verifierComments: comments,
        createdTime: new Date(),
      },
    });

    return { success: true };
  }

  // ── Officer Action (Revert / Forward / Approve / Reject) ──────────────────
  async submitOfficerAction(options: {
    submissionId: number;
    roleId: number;
    userId: number;
    action: string;
    comment: string;
    supportiveDocument?: string;
    applicationData?: any;
    userAgent?: string;
  }) {
    const { submissionId, roleId, userId, action, comment, supportiveDocument, userAgent, applicationData } = options;
    const now = new Date();

    // 0. Check for V2 Workflow Task first
    const v2Task = await this.prisma.tWorkflowForwardLevel.findFirst({
      where: {
        applicationId: BigInt(submissionId),
        currentRoleId: roleId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (v2Task) {
      // Forward to V2 Engine
      return this.engineService.executeAction({
        forwardLevelId: v2Task.id,
        actionCode: action,
        actorUserId: BigInt(userId),
        actorRoleId: roleId,
        remarks: comment,
        applicationData: applicationData,
        ipAddress: '0.0.0.0', // Will be enhanced if needed
        userAgent: userAgent || '',
      });
    }

    // Map action → applicationSubmission status (V1 legacy)
    const submissionStatus = this.mapWorkflowActionCodeToStatus(action);
    if (!submissionStatus) throw new Error(`Invalid action: ${action}`);

    // 1. Load submission + spApplication together
    const [submission, spApp] = await Promise.all([
      this.prisma.applicationSubmission.findUnique({
        where: { submissionId },
        select: { serviceId: true },
      }),
      this.prisma.spApplication.findFirst({
        where: { appId: BigInt(submissionId) },
        select: { sno: true, spTag: true },
      }),
    ]);
    if (!submission) throw new Error('Submission not found');

    // 2. Officer's dept + district + role name (parallel)
    const [deptUser, roleRow] = await Promise.all([
      this.prisma.department_users.findFirst({
        where: { user_id: BigInt(userId) },
        select: { dept_id: true, district_id: true },
      }),
      this.prisma.roles.findUnique({
        where: { id: roleId },
        select: { name: true },
      }),
    ]);
    const deptId = Number(deptUser?.dept_id || 0) || null;
    const districtId = Number(deptUser?.district_id || 0) || null;
    const roleName = roleRow?.name || '';

    // 3. Update t_application_submission
    await this.prisma.applicationSubmission.update({
      where: { submissionId },
      data: { applicationStatus: submissionStatus, applicationUpdatedDateTime: now },
    });

    // 4. Update t_sp_applications
    await this.prisma.spApplication.updateMany({
      where: { appId: BigInt(submissionId) },
      data: { appStatus: action, updatedOn: now, lastUpdatedDateTime: now, appComments: comment },
    });

    // 5. Mark current officer's pending forward row as Verified
    await this.prisma.forwardApplication.updateMany({
      where: { appSubId: submissionId, nextRoleId: roleId, approvStatus: 'P' },
      data: {
        verifierUserId: userId,
        actionStatus: action,
        verifierUserComment: comment,
        supportiveDocument: supportiveDocument || null,
        postInfo: applicationData ? JSON.stringify(applicationData) : null,
        updatedDateTime: now,
        commentDate: now,
        approvStatus: 'V',
      },
    });

    // 6. For Forward: create new pending row for next role via transitionMapJson
    let forwardNextRoleId: number | null = null;
    if (action === 'F') {
      const wfConfig = await this.prisma.applicationWorkflowConfiguration.findFirst({
        where: {
          serviceId: submission.serviceId,
          OR: [{ roleId }, { currentRoleId: roleId }],
        },
        select: { transitionMapJson: true },
      });

      const transMap = (wfConfig?.transitionMapJson ?? {}) as Record<string, { next_role_id?: number }>;
      forwardNextRoleId = transMap['F']?.next_role_id ?? null;

      if (forwardNextRoleId) {
        await this.prisma.forwardApplication.create({
          data: {
            appSubId: submissionId,
            nextRoleId: forwardNextRoleId,
            forwardedDeptId: deptId,
            forwardedDistId: districtId,
            actionStatus: 'F',
            approvStatus: 'P',
            createdOn: now,
            userAgent: userAgent || '',
          },
        });
      }
    }

    // 7. Insert history entry for timeline
    await this.prisma.applicationHistory.create({
      data: {
        sno: spApp?.sno ?? null,
        serviceId: submission.serviceId,
        spTag: spApp?.spTag ?? '',
        appId: String(submissionId),
        applicationStatus: action,
        comments: comment || null,
        approverId: String(userId),
        approverDetails: roleName,
        nextApprover: forwardNextRoleId ? String(forwardNextRoleId) : null,
        addedDateTime: now,
        roleId: String(roleId),
        roleName,
        nextRoleId: forwardNextRoleId ? String(forwardNextRoleId) : null,
        userAgent: (userAgent || '').slice(0, 255),
      },
    });

    return { success: true, action, submissionId };
  }

  // ── Counts per status — uses SAME resolved-status logic as getInbox ─────────
  async getCounts(options: { userId: bigint; userRoleId: number }) {
    const deptUser = await this.prisma.department_users.findFirst({
      where: { user_id: options.userId },
      select: { dept_id: true, district_id: true },
    });
    const actorDeptId = Number(deptUser?.dept_id || 0) || null;
    const actorDistrictId = Number(deptUser?.district_id || 0) || null;
    const actorUserId = Number(options.userId);

    const [forwardRows, v2Rows] = await Promise.all([
      this.prisma.forwardApplication.findMany({
        where: { nextRoleId: options.userRoleId, appSubId: { not: null } },
        select: {
          appSubId: true, nextUserId: true, forwardedDeptId: true, forwardedDistId: true,
          approvStatus: true, actionStatus: true,
        },
        distinct: ['appSubId'],
        orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
      }),
      this.prisma.tWorkflowForwardLevel.findMany({
        where: { currentRoleId: options.userRoleId },
        select: { applicationId: true },
      }),
    ]);

    const matchedV1 = forwardRows.filter((row) =>
      this.matchAssignment(row, { actorUserId, actorDeptId, actorDistrictId, actorRoleId: options.userRoleId }),
    );

    // Build submissionId → forward row fields for V1 (status resolved after DB fetch)
    const v1FwdMeta = new Map<number, { approvStatus: string | null; actionStatus: string | null }>();
    const idsSet = new Set<number>();

    matchedV1.forEach((r) => {
      const id = Number(r.appSubId);
      if (!Number.isFinite(id) || id <= 0) return;
      idsSet.add(id);
      v1FwdMeta.set(id, { approvStatus: r.approvStatus ?? null, actionStatus: r.actionStatus ?? null });
    });
    v2Rows.forEach(r => { const id = Number(r.applicationId); if (Number.isFinite(id) && id > 0) idsSet.add(id); });

    // ── ACTED BY ME logic for counts (Forwarded/Approved/etc) ──
    const actedRows = await this.prisma.forwardApplication.findMany({
      where: { verifierUserId: actorUserId },
      select: { appSubId: true },
      orderBy: { createdOn: 'desc' },
      take: 500,
    });
    actedRows.forEach(r => {
      const id = Number(r.appSubId);
      if (id > 0) idsSet.add(id);
    });

    const actedV2Rows = await this.prisma.tWorkflowAudit.findMany({
      where: { actorUserId: BigInt(actorUserId) },
      select: { forwardLevel: { select: { applicationId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const actedV2Ids = new Set<number>();
    actedV2Rows.forEach(r => {
      const id = Number(r.forwardLevel?.applicationId);
      if (id > 0) {
        idsSet.add(id);
        actedV2Ids.add(id);
      }
    });

    const allIds = Array.from(idsSet);
    if (!allIds.length) {
      return { byTab: { pending: 0, forwarded: 0, approved: 0, rejected: 0, reverted: 0 }, total: 0 };
    }

    const subs = await this.prisma.applicationSubmission.findMany({
      where: { submissionId: { in: allIds } },
      select: { submissionId: true, applicationStatus: true },
    });
    const subMap = new Map(subs.map(s => [Number(s.submissionId), String(s.applicationStatus || '')]));

    const v2IdSet = new Set(v2Rows.map(r => Number(r.applicationId)).filter(id => id > 0));
    const allV2IdsToFetch = Array.from(new Set([...Array.from(v2IdSet), ...Array.from(actedV2Ids)]));
    const allV2Tasks = allV2IdsToFetch.length > 0 ? await this.prisma.tWorkflowForwardLevel.findMany({
      where: { applicationId: { in: allV2IdsToFetch.map(id => BigInt(id)) } },
      select: { applicationId: true, status: true, currentProcessName: true, auditLogs: { orderBy: { createdAt: 'desc' }, take: 1, select: { actionCode: true, fromProcessName: true } } }
    }) : [];
    const v2TaskMap = new Map(allV2Tasks.map(t => [Number(t.applicationId), t]));

    const byTab: Record<string, number> = { pending: 0, forwarded: 0, approved: 0, rejected: 0, reverted: 0 };

    for (const id of allIds) {
      const dbStatus = subMap.get(id) ?? '';
      let resolved: string;

      if (v2IdSet.has(id) || actedV2Ids.has(id)) {
        // V2 or V2 Historical: resolve status from V2 task state
        const v2Task = v2TaskMap.get(id);
        if (v2Task) {
          const isCurrentActor = v2IdSet.has(id);
          const ws = this.resolveInboxStatusFromWorkflowTask(v2Task, dbStatus, isCurrentActor);
          resolved = ws.status;
        } else {
          resolved = String(dbStatus || 'P').trim().toUpperCase();
        }
      } else if (v1FwdMeta.has(id)) {
        // V1 Pending: status resolved from forward row fields
        const fwdMeta = v1FwdMeta.get(id);
        resolved = this.resolveInboxStatusFromForward(
          fwdMeta?.approvStatus,
          fwdMeta?.actionStatus,
          dbStatus,
        );
      } else {
        // V1 Historical: no current forward row for this user, rely on applicationStatus
        resolved = String(dbStatus || 'P').trim().toUpperCase();
      }

      if (resolved === 'P') byTab.pending++;
      else if (resolved === 'F') byTab.forwarded++;
      else if (resolved === 'A') byTab.approved++;
      else if (resolved === 'R') byTab.rejected++;
      else if (resolved === 'H' || resolved === 'RBI') byTab.reverted++;
    }

    return { byTab, total: byTab.pending };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private resolveInboxStatusFromForward(
    approvStatus?: string | null,
    actionStatus?: string | null,
    fallbackStatus?: string | null,
  ): string {
    const appr = String(approvStatus || '').trim().toUpperCase();
    if (appr === 'P') return 'P';

    const action = String(actionStatus || '').trim().toUpperCase();
    if (action) return this.mapWorkflowActionCodeToStatus(action) || action;

    return String(fallbackStatus || 'P').trim().toUpperCase() || 'P';
  }

  private resolveInboxStatusFromWorkflowTask(
    task: any,
    fallbackStatus?: string | null,
    isCurrentActor: boolean = true
  ): { status: string; label: string } {
    const taskState = String(task?.status || '').trim().toUpperCase();
    const lastAudit = task?.auditLogs?.[0];
    const lastAction = String(lastAudit?.actionCode || '').trim().toUpperCase();
    const fromProcessName = String(lastAudit?.fromProcessName || '').trim();

    let status = 'P';
    let label = '';

    if (taskState === 'COMPLETED' && lastAction) {
      status = this.mapWorkflowActionCodeToStatus(lastAction) || lastAction;
      const actionVerb = status === 'A' ? 'Approved' : status === 'R' ? 'Rejected' : 'Processed';
      label = fromProcessName ? `${actionVerb} by ${fromProcessName}` : `${actionVerb}`;
    } else if (taskState === 'ACTIVE' || taskState === 'WAITING_JOIN') {
      const processName = String(task?.currentProcessName || '').trim();
      if (fallbackStatus === 'PD') {
        status = 'PD';
        label = processName ? `Payment Pending at ${processName}` : 'Payment Pending';
      } else {
        status = isCurrentActor ? 'P' : 'F';
        label = processName ? (isCurrentActor ? `Pending at ${processName}` : `Forwarded to ${processName}`) : (isCurrentActor ? 'Pending' : 'Forwarded');
      }
    } else {
      status = String(fallbackStatus || 'P').trim().toUpperCase();
      label = this.friendlyStatus(status);
    }

    return { status, label };
  }

  private mapWorkflowActionCodeToStatus(actionCode?: string | null): string | null {
    const code = String(actionCode || '').trim().toUpperCase();
    if (!code) return null;
    if (['APPROVE', 'APPROVED', 'A'].includes(code)) return 'A';
    if (['REJECT', 'REJECTED', 'R'].includes(code)) return 'R';
    if (['FORWARD', 'FORWARDED', 'F'].includes(code)) return 'F';
    if (['REVERT', 'RETURN', 'RBI', 'REVERTED', 'H'].includes(code)) return 'RBI';
    return code;
  }

  private getDisplayUnitName(
    unitName: unknown,
    fieldValue: unknown,
    submissionId?: number | bigint | string | null,
  ): string {
    const rawUnit = String(unitName || '').trim();
    if (rawUnit && !/^\d+(\.\d+)?$/.test(rawUnit)) {
      return rawUnit;
    }

    const flat = this.flattenFieldValue(fieldValue);
    const preferredKeys = [
      'UK-FCL-03893_0',
      'UK-FCL-03886_0',
      'unitName',
      'companyName',
      'projectName',
      'promoterName',
      'applicant_name',
    ];

    for (const key of preferredKeys) {
      const value = flat[key];
      if (value === null || value === undefined) continue;
      const text = String(value).trim();
      if (!text || /^\d+(\.\d+)?$/.test(text)) continue;
      return text;
    }

    if (rawUnit) return rawUnit;
    const sid = Number(submissionId || 0);
    return sid > 0 ? `Application #${sid}` : 'Application';
  }

  private flattenFieldValue(fieldValue: unknown): Record<string, unknown> {
    const out: Record<string, unknown> = {};

    const visit = (node: unknown) => {
      if (!this.isPlainObject(node)) return;
      for (const [key, value] of Object.entries(node)) {
        if (Array.isArray(value)) continue;
        if (this.isPlainObject(value)) {
          visit(value);
          continue;
        }
        out[key] = value;
      }
    };

    visit(fieldValue);
    return out;
  }

  private async resolveDisplayFormData(
    formData: Record<string, unknown>,
    builderFields: Array<{
      formField?: { formCheckId?: string | null } | null;
      optionConfig?: {
        source_type?: OptionSourceType | string | null;
        master_table_id?: number | null;
        static_options?: unknown;
      } | null;
    }>,
  ): Promise<Record<string, unknown>> {
    const source = this.isPlainObject(formData) ? formData : {};
    const fieldResolvers = new Map<string, { source: 'STATIC' | 'MASTER'; staticMap?: Map<string, string>; masterId?: number }>();

    for (const bf of builderFields) {
      const fieldCode = String(bf?.formField?.formCheckId || '').trim();
      const optionConfig = bf?.optionConfig;
      if (!fieldCode || !optionConfig) continue;

      const sourceType = String(optionConfig.source_type || '').trim().toUpperCase();
      if (sourceType === OptionSourceType.STATIC) {
        fieldResolvers.set(fieldCode, {
          source: 'STATIC',
          staticMap: this.parseStaticOptions(optionConfig.static_options),
        });
        continue;
      }

      if (sourceType === OptionSourceType.MASTER && Number(optionConfig.master_table_id || 0) > 0) {
        fieldResolvers.set(fieldCode, {
          source: 'MASTER',
          masterId: Number(optionConfig.master_table_id),
        });
      }
    }

    const masterWanted = new Map<number, { ids: Set<bigint>; codes: Set<string> }>();
    for (const [fieldCode, resolver] of fieldResolvers.entries()) {
      if (resolver.source !== 'MASTER' || !resolver.masterId) continue;

      const collectFromNode = (node: unknown) => {
        if (Array.isArray(node)) {
          node.forEach((item) => collectFromNode(item));
          return;
        }
        if (!this.isPlainObject(node)) return;

        for (const [key, value] of Object.entries(node)) {
          if (key === fieldCode) {
            const bucket = masterWanted.get(resolver.masterId!) || { ids: new Set<bigint>(), codes: new Set<string>() };
            for (const token of this.extractOptionTokens(value)) {
              if (/^\d+$/.test(token)) {
                try {
                  bucket.ids.add(BigInt(token));
                } catch {
                  bucket.codes.add(token);
                }
              } else {
                bucket.codes.add(token);
              }
            }
            masterWanted.set(resolver.masterId!, bucket);
          }
          if (this.isPlainObject(value) || Array.isArray(value)) {
            collectFromNode(value);
          }
        }
      };

      collectFromNode(source);
    }

    const masterLabelMaps = new Map<number, Map<string, string>>();
    for (const [masterId, wanted] of masterWanted.entries()) {
      const orConditions: any[] = [];
      if (wanted.ids.size > 0) {
        orConditions.push({ id: { in: Array.from(wanted.ids) } });
      }
      if (wanted.codes.size > 0) {
        orConditions.push({ code: { in: Array.from(wanted.codes) } });
      }
      if (!orConditions.length) continue;

      const rows = await this.prisma.masterData.findMany({
        where: {
          master_id: masterId,
          is_active: true,
          OR: orConditions,
        },
        select: { id: true, code: true, data: true },
      });

      const labelMap = new Map<string, string>();
      for (const row of rows) {
        const label = this.extractMasterLabel(row.data, String(row.id));
        labelMap.set(String(row.id), label);
        const rowCode = String(row.code || '').trim();
        if (rowCode) labelMap.set(rowCode, label);
      }

      masterLabelMaps.set(masterId, labelMap);
    }

    const resolveOptionValue = (value: unknown, labelMap: Map<string, string>): unknown => {
      const resolveSingle = (raw: unknown): unknown => {
        if (raw === null || raw === undefined) return raw;
        const key = String(raw).trim();
        if (!key) return raw;
        return labelMap.get(key) || raw;
      };

      if (Array.isArray(value)) {
        return value.map((item) => resolveSingle(item)).join(', ');
      }

      if (typeof value === 'string' && value.includes(',')) {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => resolveSingle(item))
          .join(', ');
      }

      return resolveSingle(value);
    };

    const transformNode = (node: unknown): unknown => {
      if (Array.isArray(node)) return node.map((item) => transformNode(item));
      if (!this.isPlainObject(node)) return node;

      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        const resolver = fieldResolvers.get(key);
        if (resolver?.source === 'STATIC') {
          out[key] = resolveOptionValue(value, resolver.staticMap || new Map<string, string>());
          continue;
        }
        if (resolver?.source === 'MASTER' && resolver.masterId) {
          const labels = masterLabelMaps.get(resolver.masterId);
          out[key] = labels ? resolveOptionValue(value, labels) : value;
          continue;
        }
        out[key] = transformNode(value);
      }
      return out;
    };

    return (transformNode(source) || {}) as Record<string, unknown>;
  }

  private extractOptionTokens(value: unknown): string[] {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => this.extractOptionTokens(item))
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (this.isPlainObject(value) && (value as any).value !== undefined) {
      return this.extractOptionTokens((value as any).value);
    }
    if (typeof value === 'string') {
      return value.includes(',')
        ? value.split(',').map((item) => item.trim()).filter(Boolean)
        : [value.trim()].filter(Boolean);
    }
    return [String(value).trim()].filter(Boolean);
  }

  private parseStaticOptions(staticOptions: unknown): Map<string, string> {
    const map = new Map<string, string>();
    if (!staticOptions) return map;

    let parsed: unknown = staticOptions;
    if (typeof staticOptions === 'string') {
      try {
        parsed = JSON.parse(staticOptions);
      } catch {
        return map;
      }
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!this.isPlainObject(item)) continue;
        const value = (item as any).value ?? (item as any).id ?? (item as any).code ?? (item as any).key;
        if (value === null || value === undefined) continue;
        const key = String(value).trim();
        if (!key) continue;
        const labelRaw = (item as any).label ?? (item as any).name ?? (item as any).title ?? key;
        const label = String(labelRaw).trim() || key;
        map.set(key, label);
      }
      return map;
    }

    if (this.isPlainObject(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        const k = String(key).trim();
        if (!k) continue;
        const v = String(value ?? '').trim() || k;
        map.set(k, v);
      }
    }

    return map;
  }

  private extractMasterLabel(data: unknown, fallback: string): string {
    if (!this.isPlainObject(data)) return fallback;
    const payload = data as Record<string, unknown>;
    const preferredKeys = ['name', 'name_en', 'label', 'title', 'display_name', 'displayName'];
    for (const key of preferredKeys) {
      const candidate = payload[key];
      if (candidate === null || candidate === undefined) continue;
      const text = String(candidate).trim();
      if (text) return text;
    }

    for (const value of Object.values(payload)) {
      if (value === null || value === undefined) continue;
      const text = String(value).trim();
      if (text) return text;
    }

    return fallback;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private matchAssignment(
    row: { nextUserId: number | null; forwardedDeptId: number | null; forwardedDistId: number | null },
    actor: { actorUserId: number; actorRoleId: number; actorDeptId: number | null; actorDistrictId: number | null }
  ) {
    const nextUserId = Number(row.nextUserId || 0) || null;
    if (nextUserId) {
      if (nextUserId === actor.actorUserId || nextUserId === actor.actorRoleId) return true;
    }

    const rowDept = Number(row.forwardedDeptId || 0) || null;
    if (!rowDept) return true;
    if (!actor.actorDeptId) return true;
    if (rowDept !== actor.actorDeptId) return false;

    const rowDist = Number(row.forwardedDistId || 0) || null;
    if (rowDist && actor.actorDistrictId && rowDist !== actor.actorDistrictId) return false;

    return true;
  }

  private friendlyStatus(status?: string | null) {
    const code = String(status || '').toUpperCase();
    if (['P', 'PENDING'].includes(code)) return 'Pending';
    if (['DP', 'PD'].includes(code)) return 'Payment Pending';
    if (['F', 'FORWARDED'].includes(code)) return 'Forwarded';
    if (['FA'].includes(code)) return 'Forwarded to Approver';
    if (['A', 'APPROVED'].includes(code)) return 'Approved';
    if (['R', 'REJECTED', 'REJECT'].includes(code)) return 'Rejected';
    if (['RBI', 'REVERTED'].includes(code)) return 'Reverted';
    if (['H', 'REVERTED'].includes(code)) return 'Reverted';
    return code || 'Unknown';
  }

  async getChallanEstimate(submissionId: number, applicationDataOverride?: any) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { serviceId: true, fieldValue: true },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const wfConfigRow = await this.prisma.workflowConfiguration.findFirst({
      where: { serviceId: submission.serviceId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!wfConfigRow || !wfConfigRow.configuration) {
      return { totalAmount: 0, bifurcations: [{ name: '', amount: 0 }] };
    }

    const configData = wfConfigRow.configuration as any;

    // Find the current active process for this submission
    const v2Task = await this.prisma.tWorkflowForwardLevel.findFirst({
      where: { applicationId: BigInt(submissionId), status: 'ACTIVE' },
    });

    let challanRules: any[] = [];
    if (v2Task && configData?.processes) {
      const process = configData.processes.find((p: any) => p.processCode === v2Task.currentProcessCode);
      if (process && process.challanRules) {
        challanRules = process.challanRules;
      }
    } else {
      // Fallback to top-level if any (legacy or incorrectly saved data)
      challanRules = configData.challanRules || [];
    }

    if (!Array.isArray(challanRules) || challanRules.length === 0) {
      return { totalAmount: 0, bifurcations: [{ name: '', amount: 0 }] };
    }

    // Merge override data with original field data
    const mergedData = {
      ...(typeof submission.fieldValue === 'object' ? submission.fieldValue : {}),
      ...(typeof applicationDataOverride === 'object' ? applicationDataOverride : {}),
    };

    const context = { formData: mergedData };
    const calculatedBifurcations: any[] = [];
    let totalAmount = 0;

    console.log(`[CHALLAN-ESTIMATE] Found ${challanRules.length} rules for sub ${submissionId}`);
    for (const rule of challanRules) {
      if (!rule.formula) continue;

      // Transform dot notation for formData to bracket notation to support hyphenated IDs (e.g. formData.UK-FCL... -> formData['UK-FCL...'])
      const transformFormula = (f: string) => f.replace(/formData\.([a-zA-Z0-9_\-]+)/g, "formData['$1']");
      const formula = transformFormula(rule.formula);
      const condition = rule.condition ? transformFormula(rule.condition) : null;

      console.log(`[CHALLAN-ESTIMATE] Rule: ${rule.name}, Original: ${rule.formula}, Transformed: ${formula}`);
      console.log(`[CHALLAN-ESTIMATE] Context Keys:`, Object.keys(context.formData));

      let conditionMet = true;
      if (condition && condition.trim() !== '' && condition !== 'default') {
        try {
          const result = await jexl.eval(condition, context);
          conditionMet = Boolean(result);
        } catch (e) {
          console.error('Condition evaluation failed for rule:', rule.name, e);
          conditionMet = false; // Fail safe
        }
      }

      if (conditionMet) {
        try {
          const rawAmount = await jexl.eval(formula, context);
          const numericAmount = Number(rawAmount);

          if (!Number.isNaN(numericAmount) && numericAmount > 0) {
            // Round to 2 decimals
            const roundedAmount = Math.round(numericAmount * 100) / 100;
            calculatedBifurcations.push({
              name: rule.name || 'Fee Component',
              amount: roundedAmount,
            });
            totalAmount += roundedAmount;
          }
        } catch (e) {
          console.error('Formula evaluation failed for rule:', rule.name, e);
        }
      }
    }

    if (calculatedBifurcations.length === 0) {
      return { totalAmount: 0, bifurcations: [{ name: '', amount: 0 }] };
    }

    return { totalAmount, bifurcations: calculatedBifurcations };
  }

  private extractApplicantName(fieldValue: unknown): string {
    const src = (fieldValue || {}) as Record<string, any>;
    const applicant = src.applicant || {};
    return (
      applicant.firstName && applicant.lastName
        ? `${applicant.firstName} ${applicant.lastName}`.trim()
        : applicant.name || src.applicant_name || src.companyName || 'N/A'
    );
  }
}
