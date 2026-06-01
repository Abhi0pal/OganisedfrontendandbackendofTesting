import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UnifiedDraftService } from './unified-draft.service';
import { SaveUnifiedApplicationDto } from './dto/save-unified-application.dto';
import { UpdateUnifiedApplicationDto } from './dto/update-unified-application.dto';

@Injectable()
export class UnifiedApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly draftService: UnifiedDraftService,
  ) {}

  async getApplications(options: { userId: bigint; serviceId?: string }) {
    const where: any = { userId: options.userId };
    if (options.serviceId) {
      where.serviceId = String(options.serviceId);
    }
    const rows = await this.prisma.applicationSubmission.findMany({
      where,
      select: {
        submissionId: true,
        applicationStatus: true,
        serviceId: true,
        deptId: true,
        unitName: true,
        applicationUpdatedDateTime: true,
      },
      orderBy: { submissionId: 'desc' },
    });
    return rows.map((row) => ({
      submissionId: row.submissionId,
      status: row.applicationStatus,
      serviceId: row.serviceId,
      departmentId: row.deptId,
      unitName: row.unitName || '',
      updatedOn: row.applicationUpdatedDateTime,
    }));
  }

  async getDraftApplication(options: { userId: bigint; submissionId: number }) {
    return this.draftService.getDraftApplication(options);
  }

  async findArchitectByNo(architectNo: string) {
    const value = String(architectNo || '').trim();
    if (!value) {
      throw new BadRequestException('architectNo is required');
    }

    const endpoint = 'https://csii.in/swcs/find-architect';
    const commonHeaders = {
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://csii.in',
      Referer: 'https://csii.in/swcs/find-architect',
      'User-Agent': 'Mozilla/5.0',
    };

    const attempts: Array<() => Promise<Response>> = [
      async () => {
        const form = new URLSearchParams();
        form.set('architectNo', value);
        return fetch(endpoint, {
          method: 'POST',
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        });
      },
      async () => {
        const form = new FormData();
        form.append('architectNo', value);
        return fetch(endpoint, {
          method: 'POST',
          headers: commonHeaders,
          body: form,
        });
      },
      async () =>
        fetch(endpoint, {
          method: 'POST',
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ architectNo: value }),
        }),
      async () =>
        fetch(`${endpoint}?architectNo=${encodeURIComponent(value)}`, {
          method: 'GET',
          headers: commonHeaders,
        }),
    ];

    let lastStatus = 0;
    let lastBody = '';

    for (const attempt of attempts) {
      const response = await attempt();
      const raw = await response.text();
      lastStatus = response.status;
      lastBody = raw;

      if (!response.ok) continue;

      try {
        return JSON.parse(raw);
      } catch {
        return { data: null, status: 'SUCCESS', raw };
      }
    }

    throw new BadRequestException({
      message: 'Failed to fetch architect details',
      upstreamStatus: lastStatus,
      upstreamBody: lastBody?.slice(0, 500),
    });
  }

  async saveApplication(options: {
    userId: bigint;
    body: SaveUnifiedApplicationDto;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const dto = options.body;
    return this.draftService.submitDraftApplication({
      userId: options.userId,
      serviceId: dto.serviceId,
      departmentId: dto.departmentId,
      formTypeId: dto.formTypeId,
      processingLevel: dto.processingLevel,
      formData: dto.formData,
      unitName: dto.unitName,
      districtId: dto.districtId,
      cafType: dto.cafType,
      parentSubId: dto.parentSubId,
      cafId: dto.cafId,
      existingUbuId: dto.existingUbuId,
      revertedCallBackUrl: dto.revertedCallBackUrl,
      printAppCallBackUrl: dto.printAppCallBackUrl,
      downloadCertificateCallBackUrl: dto.downloadCertificateCallBackUrl,
      currentStep: dto.currentStep,
      ipAddress: options.ipAddress || '',
      userAgent: options.userAgent || '',
    });
  }

  async updateApplication(options: {
    userId: bigint;
    body: UpdateUnifiedApplicationDto;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const dto = options.body;
    if (!dto.submissionId) {
      throw new BadRequestException('submissionId is required');
    }
    return this.draftService.updateDraftApplication({
      submissionId: dto.submissionId,
      userId: options.userId,
      serviceId: dto.serviceId,
      departmentId: dto.departmentId,
      formTypeId: dto.formTypeId,
      processingLevel: dto.processingLevel,
      formData: dto.formData,
      unitName: dto.unitName,
      districtId: dto.districtId,
      cafType: dto.cafType,
      existingUbuId: dto.existingUbuId,
      revertedCallBackUrl: dto.revertedCallBackUrl,
      printAppCallBackUrl: dto.printAppCallBackUrl,
      downloadCertificateCallBackUrl: dto.downloadCertificateCallBackUrl,
      currentStep: dto.currentStep,
      isFinalSubmit: dto.isFinalSubmit,
      ipAddress: options.ipAddress || '',
      userAgent: options.userAgent || '',
    });
  }
}
