import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class InprincipleHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getApplicationHistory(options: {
    submissionId: number;
    userId: bigint;
  }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    if (submission.userId !== options.userId) {
      throw new BadRequestException('Unauthorized history access');
    }

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { appStatus: true, sno: true },
    });
    const investorUser = await this.prisma.users.findUnique({
      where: { id: submission.userId },
      select: {
        email: true,
        investor_profile: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });
    const investorName = [
      investorUser?.investor_profile?.first_name,
      investorUser?.investor_profile?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    const investorPendingLabel = investorUser?.email
      ? `Investor: ${investorName || 'Application Owner'} <${investorUser.email}>`
      : `Investor: ${investorName || 'Application Owner'}`;

    const history = await this.prisma.applicationHistory.findMany({
      where: spApp?.sno
        ? { sno: spApp.sno }
        : { appId: String(options.submissionId) },
      orderBy: { historyId: 'desc' },
    });
    const forwardRows = await this.prisma.forwardApplication.findMany({
      where: { appSubId: options.submissionId },
      select: {
        apprLvlId: true,
        createdOn: true,
        verifierUserId: true,
        forwardedDeptId: true,
        nextRoleId: true,
        nextUserId: true,
      },
      orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
    });
    const nextUserIds = Array.from(
      new Set(
        forwardRows
          .map((row) => Number(row.nextUserId || 0))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    );
    const nextRoleIds = Array.from(
      new Set(
        forwardRows
          .map((row) => Number(row.nextRoleId || 0))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    );
    const deptIds = Array.from(
      new Set(
        forwardRows
          .map((row) => Number(row.forwardedDeptId || 0))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    );
    const parseForwardTargets = (value?: string | null) => {
      const raw = String(value || '').trim();
      if (!raw) return [] as Array<{ roleId?: number; deptId?: number; userId?: number }>;
      return raw
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => {
          const compact = token.replace(/\s+/g, '');
          const triple = compact.match(/^(\d+)-(\d+)-(\d+)$/);
          if (triple) {
            return {
              roleId: Number(triple[1]),
              deptId: Number(triple[2]),
              userId: Number(triple[3]),
            };
          }
          const pair = compact.match(/^(\d+)-(\d+)$/);
          if (pair) {
            return {
              roleId: Number(pair[1]),
              deptId: Number(pair[2]),
            };
          }
          return {} as { roleId?: number; deptId?: number; userId?: number };
        })
        .filter((item) => item.roleId || item.deptId || item.userId);
    };
    history.forEach((item: any) => {
      parseForwardTargets(item?.param1).forEach((target) => {
        if (Number.isFinite(Number(target.roleId)) && Number(target.roleId) > 0) {
          nextRoleIds.push(Number(target.roleId));
        }
        if (Number.isFinite(Number(target.deptId)) && Number(target.deptId) > 0) {
          deptIds.push(Number(target.deptId));
        }
        if (Number.isFinite(Number(target.userId)) && Number(target.userId) > 0) {
          nextUserIds.push(Number(target.userId));
        }
      });
    });
    const allocatedUsers = nextUserIds.length
      ? await this.prisma.users.findMany({
          where: { id: { in: nextUserIds.map((value) => BigInt(value)) } },
          select: {
            id: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            department_user: {
              select: {
                full_name: true,
                email: true,
              },
            },
          },
        })
      : [];
    const roleRecords = nextRoleIds.length
      ? await this.prisma.roles.findMany({
          where: { id: { in: nextRoleIds } },
          select: { id: true, name: true },
        })
      : [];
    const deptRecords = deptIds.length
      ? await this.prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        })
      : [];
    const userById = new Map(
      allocatedUsers.map((user) => [Number(user.id), user]),
    );
    const roleNameById = new Map(
      roleRecords.map((role) => [Number(role.id), role.name || `Role ${role.id}`]),
    );
    const deptNameById = new Map(
      deptRecords.map((dept) => [
        Number(dept.id),
        dept.name || `Department ${dept.id}`,
      ]),
    );

    const resolvePendingAt = (item: {
      addedDateTime: Date;
      applicationStatus?: string | null;
      comments?: string | null;
      approverId?: string | null;
      nextRoleId?: string | null;
      param1?: string | null;
    }) => {
      const statusCode = String(item.applicationStatus || '').toUpperCase();
      if (['RBI', 'REVERTED'].includes(statusCode)) {
        return investorPendingLabel;
      }
      const isForwardLikeStatus = ['F', 'FA'].includes(statusCode);
      const isForwardLikeComment = /forward|assign/i.test(
        String(item.comments || ''),
      );
      if (!isForwardLikeStatus && !isForwardLikeComment) {
        return '--';
      }
      const explicitTargets = parseForwardTargets(item.param1);
      if (explicitTargets.length) {
        const labels = Array.from(
          new Set(
            explicitTargets
              .map((target) => {
                const deptId =
                  Number.isFinite(Number(target.deptId || 0)) &&
                  Number(target.deptId || 0) > 0
                    ? Number(target.deptId || 0)
                    : null;
                const nextRoleId =
                  Number.isFinite(Number(target.roleId || 0)) &&
                  Number(target.roleId || 0) > 0
                    ? Number(target.roleId || 0)
                    : null;
                const nextUserId =
                  Number.isFinite(Number(target.userId || 0)) &&
                  Number(target.userId || 0) > 0
                    ? Number(target.userId || 0)
                    : null;
                const user = nextUserId ? userById.get(nextUserId) : null;
                const designation =
                  user?.role?.name ||
                  (nextRoleId ? roleNameById.get(nextRoleId) : null) ||
                  (nextRoleId ? `Role ${nextRoleId}` : 'Officer');
                const officerName =
                  user?.department_user?.full_name ||
                  (nextUserId ? `User ${nextUserId}` : 'Unallocated User');
                const officerEmail =
                  user?.department_user?.email || user?.email || null;
                const departmentName =
                  deptId && deptNameById.get(deptId)
                    ? deptNameById.get(deptId)
                    : deptId
                      ? `Department ${deptId}`
                      : 'Department N/A';
                const userLabel = officerEmail
                  ? `${officerName} <${officerEmail}>`
                  : officerName;
                return `${departmentName} / ${designation} / ${userLabel}`;
              })
              .filter(Boolean),
          ),
        );
        if (labels.length) return labels.join('; ');
      }

      const historyNextRoleId =
        Number.isFinite(Number(item.nextRoleId || 0)) &&
        Number(item.nextRoleId || 0) > 0
          ? Number(item.nextRoleId || 0)
          : null;
      const matchingForwardRows = forwardRows.filter((row) => {
        const diffMs = Math.abs(
          row.createdOn.getTime() - item.addedDateTime.getTime(),
        );
        if (diffMs > 24 * 60 * 60 * 1000) return false;
        if (
          historyNextRoleId &&
          Number.isFinite(Number(row.nextRoleId || 0)) &&
          Number(row.nextRoleId || 0) > 0 &&
          Number(row.nextRoleId || 0) !== historyNextRoleId
        ) {
          return false;
        }
        return true;
      });
      if (!matchingForwardRows.length) return '--';

      const uniqueRecipients = Array.from(
        new Map(
          matchingForwardRows.map((row) => [
            `${Number(row.forwardedDeptId || 0)}-${Number(row.nextRoleId || 0)}-${Number(row.nextUserId || 0)}`,
            row,
          ]),
        ).values(),
      );
      const recipientLabels = uniqueRecipients.map((row) => {
        const deptId =
          Number.isFinite(Number(row.forwardedDeptId || 0)) &&
          Number(row.forwardedDeptId || 0) > 0
            ? Number(row.forwardedDeptId || 0)
            : null;
        const nextRoleId =
          Number.isFinite(Number(row.nextRoleId || 0)) &&
          Number(row.nextRoleId || 0) > 0
            ? Number(row.nextRoleId || 0)
            : null;
        const nextUserId =
          Number.isFinite(Number(row.nextUserId || 0)) &&
          Number(row.nextUserId || 0) > 0
            ? Number(row.nextUserId || 0)
            : null;
        const user = nextUserId ? userById.get(nextUserId) : null;
        const designation =
          user?.role?.name ||
          (nextRoleId ? roleNameById.get(nextRoleId) : null) ||
          (nextRoleId ? `Role ${nextRoleId}` : 'Officer');
        const officerName =
          user?.department_user?.full_name ||
          (nextUserId ? `User ${nextUserId}` : 'Unallocated User');
        const officerEmail =
          user?.department_user?.email || user?.email || null;
        const departmentName =
          deptId && deptNameById.get(deptId)
            ? deptNameById.get(deptId)
            : deptId
              ? `Department ${deptId}`
              : 'Department N/A';
        const userLabel = officerEmail
          ? `${officerName} <${officerEmail}>`
          : officerName;
        return `${departmentName} / ${designation} / ${userLabel}`;
      });
      return recipientLabels.length ? recipientLabels.join('; ') : '--';
    };

    const getStatus = (item?: { applicationStatus?: string | null } | null) =>
      String(item?.applicationStatus || '').toUpperCase();

    const applicantTransitions = new Set([
      'I|DP',
      'DP|PD',
      'PD|I',
      'I|P',
      'RBI|I',
    ]);

    const departmentTransitions = new Set([
      'P|F',
      'F|FA',
      'F|A',
      'F|R',
      'F|RBI',
      'P|RBI',
    ]);

    const perRow = history.map((item, index) => {
      const next = index + 1 < history.length ? history[index + 1] : null;
      const currentStatus = getStatus(item);
      const previousStatus = getStatus(next);
      const key = `${previousStatus}|${currentStatus}`;
      const seconds = next
        ? Math.abs(
            item.addedDateTime.getTime() - next.addedDateTime.getTime(),
          ) / 1000
        : 0;
      const applicantSeconds = applicantTransitions.has(key) ? seconds : 0;
      const departmentSeconds = departmentTransitions.has(key) ? seconds : 0;
      return {
        applicantSeconds,
        departmentSeconds,
      };
    });

    const totalApplicantSeconds = perRow.reduce(
      (sum, row) => sum + row.applicantSeconds,
      0,
    );
    const totalDepartmentSeconds = perRow.reduce(
      (sum, row) => sum + row.departmentSeconds,
      0,
    );

    const rows = history.map((item, index) => ({
      id: item.historyId,
      sequence: index + 1,
      actionBy:
        item.roleUserInfo ||
        item.approverDetails ||
        (item.roleName ? item.roleName : 'Investor'),
      actionOn: item.addedDateTime,
      status: item.applicationStatus,
      comments: item.comments || '',
      nextRoleId: item.nextRoleId || null,
      pendingAt: resolvePendingAt(item),
      timeTakenByApplicantSeconds: perRow[index]?.applicantSeconds || 0,
      timeTakenByDepartmentSeconds: perRow[index]?.departmentSeconds || 0,
    }));

    rows.push({
      id: 0,
      sequence: rows.length + 1,
      actionBy: '',
      actionOn: new Date(0),
      status: '',
      comments: 'Total',
      nextRoleId: null,
      pendingAt: '',
      timeTakenByApplicantSeconds: totalApplicantSeconds,
      timeTakenByDepartmentSeconds: totalDepartmentSeconds,
    });

    return rows;
  }
}
