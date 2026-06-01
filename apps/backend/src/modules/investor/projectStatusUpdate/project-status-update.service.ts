import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectStatusUpdateDto } from './dto';

@Injectable()
export class ProjectStatusUpdateService {
  constructor(private prisma: PrismaService) {}

  private computeEndDate(createdAt: Date | string | null | undefined, validityPeriod: string) {
    const baseDate = createdAt ? new Date(createdAt) : null;
    if (!baseDate || Number.isNaN(baseDate.getTime())) return '';

    const normalized = String(validityPeriod || '').toLowerCase();
    const years = normalized.includes('5') ? 5 : normalized.includes('3') ? 3 : 1;
    const endDate = new Date(baseDate);
    endDate.setFullYear(endDate.getFullYear() + years);
    return endDate.toISOString().slice(0, 10);
  }

  async getCafOptions(userId: bigint, serviceId?: string) {
    const targetServiceId = String(serviceId || '').trim();
    const isAgentSelectionService =
      targetServiceId.startsWith('12255') ||
      targetServiceId.startsWith('12254') ||
      targetServiceId.startsWith('12253');
    const allowedServiceIds = isAgentSelectionService
      ? ['12222.0']
      : ['12262.0'];
    const submissions = await this.prisma.applicationSubmission.findMany({
      where: {
        userId,
        applicationStatus: 'A',
        serviceId: { in: allowedServiceIds },
      },
      orderBy: { submissionId: 'desc' },
      select: {
        submissionId: true,
        unitName: true,
        serviceId: true,
        applicationCreatedDate: true,
        fieldValue: true,
      },
    });

    if (isAgentSelectionService) {
      return submissions.map((item) => {
        const agentTypeCode = String((item.fieldValue as any)?.fields?.['UK-FCL-03622_0'] || '').trim();
        const agentName = String((item.fieldValue as any)?.fields?.['UK-FCL-03623_0'] || '').trim();
        const validityPeriod = String((item.fieldValue as any)?.fields?.['UK-FCL-03629_0'] || '').trim();
        return {
          submissionId: item.submissionId,
          unitName: item.unitName || '',
          serviceId: item.serviceId,
          registrationNumber: String(item.submissionId || '').trim(),
          agentName,
          agentType: agentTypeCode,
          currentStatus: 'Approved',
          registrationValidityEndDate: this.computeEndDate(item.applicationCreatedDate, validityPeriod),
          label: `${agentName || item.unitName || 'Agent'} - ${item.submissionId}`,
        };
      });
    }

    return submissions.map((item) => ({
      submissionId: item.submissionId,
      unitName: item.unitName || '',
      serviceId: item.serviceId,
      registrationNumber:
        String((item.fieldValue as any)?.fields?.['UK-FCL-00280_0'] || item.submissionId || '').trim(),
      projectName: String((item.fieldValue as any)?.fields?.['UK-FCL-03893_0'] || '').trim(),
      promoterName: String((item.fieldValue as any)?.fields?.['UK-FCL-03886_0'] || '').trim(),
      approvedCompletionDate: String((item.fieldValue as any)?.fields?.['UK-FCL-03895_0'] || '').trim(),
      label: `${String((item.fieldValue as any)?.fields?.['UK-FCL-03893_0'] || item.unitName || 'Project').trim()} - ${item.submissionId}`,
    }));
  }

  async create(userId: bigint, dto: CreateProjectStatusUpdateDto) {
    return this.prisma.projectStatusUpdate.create({
      data: {
        cafId: dto.cafId,
        userId,
        lastApprovalStatus: dto.lastApprovalStatus,
        trialProduction: dto.trialProduction,
        categoryA: dto.categoryA,
        categoryB: dto.categoryB,
        categoryC: dto.categoryC,
        categoryD: dto.categoryD,
        male: dto.male,
        female: dto.female,
        others: dto.others,
        totalEmployment: dto.totalEmployment,
        commercialCommencementDate: dto.commercialCommencementDate
          ? new Date(dto.commercialCommencementDate)
          : null,
        landType: dto.landType,
        landAllotmentStage: dto.landAllotmentStage,
        projectStatus: dto.projectStatus,
        currentStatus: dto.currentStatus,
        notImplementationReason: dto.notImplementationReason,
        droppedWithdrawnRemarks: dto.droppedWithdrawnRemarks,
        remarks: dto.remarks,
      },
    });
  }
}
