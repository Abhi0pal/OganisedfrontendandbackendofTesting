import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateInformationWizardDto, UpdateInformationWizardDto } from './dto';

@Injectable()
export class InformationWizardService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { riskCategory: { contains: filters.search, mode: 'insensitive' } },
        { sizeOfFirm: { contains: filters.search, mode: 'insensitive' } },
        { businessLocation: { contains: filters.search, mode: 'insensitive' } },
        { investorType: { contains: filters.search, mode: 'insensitive' } },
        {
          service: {
            is: {
              service_name: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    return this.prisma.informationWizard.findMany({
      where,
      include: {
        service: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.informationWizard.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });
  }

  async findAllPublic() {
    const services = await this.prisma.service.findMany({
      where: { isActive: true, department_id: { not: null } },
      include: {
        serviceDetail: true,
        informationWizard: true,
      },
      orderBy: { service_name: 'asc' },
    });

    const checklistDocIds = services.flatMap((service) => {
      const mapping = Array.isArray(service.document_checklist_mapping)
        ? service.document_checklist_mapping
        : [];
      return mapping
        .map((item: any) => Number(item?.doc_id))
        .filter((id) => Number.isFinite(id));
    });
    const uniqueChecklistIds = Array.from(new Set(checklistDocIds));
    const checklistDocs = uniqueChecklistIds.length
      ? await this.prisma.documentMaster.findMany({
          where: { id: { in: uniqueChecklistIds } },
          include: { documentType: true, issuer: true },
        })
      : [];
    const checklistDocMap = new Map<number, any>(
      checklistDocs.map((doc) => [doc.id, doc])
    );

    return services.map((service) => {
      const info = service.informationWizard;
      const checklistMapping = Array.isArray(service.document_checklist_mapping)
        ? service.document_checklist_mapping
        : [];
      const documentChecklistItems = checklistMapping.map((item: any) => {
        const docId = Number(item?.doc_id);
        const doc = checklistDocMap.get(docId);
        return {
          doc_id: String(item?.doc_id ?? ''),
          is_required: item?.is_required ?? 'N',
          doc_comment: item?.doc_comment ?? '',
          documentCode: doc?.checklistId ?? null,
          documentType: doc?.documentType?.name ?? null,
          issuedBy: doc?.issuer?.name ?? null,
          documentName: doc?.checklistDocumentName ?? null,
          documentPath: doc?.prescribedDocumentPath ?? null,
        };
      });
      return {
        id: service.id,
        serviceId: service.id,
        serviceCode: service.service_id ?? null,
        statuaryFormPath: info?.statuaryFormPath ?? null,
        feeStructurePath: info?.feeStructurePath ?? null,
        sopDocumentPath: info?.sopDocumentPath ?? null,
        stageWiseTimelinePath: info?.stageWiseTimelinePath ?? null,
        statuaryTimelinePath: info?.statuaryTimelinePath ?? null,
        statuaryTimelineText: info?.statuaryTimelineText ?? null,
        inspectionChecklistPath: info?.inspectionChecklistPath ?? null,
        documentChecklistItems,
        riskCategory: info?.riskCategory ?? null,
        sizeOfFirm: info?.sizeOfFirm ?? null,
        businessLocation: info?.businessLocation ?? null,
        investorType: info?.investorType ?? null,
        isActive: info?.isActive ?? false,
        createdAt: info?.createdAt ?? service.createdAt,
        updatedAt: info?.updatedAt ?? service.updatedAt,
        hasInformationWizard: !!info,
        service: {
          id: service.id,
          service_id: service.service_id ?? null,
          service_name: service.service_name,
          service_level: service.service_level ?? null,
          service_status: service.service_status ?? null,
          service_category: service.serviceDetail?.serviceCategory ?? null,
          department: null,
        },
      };
    });
  }

  async create(dto: CreateInformationWizardDto) {
    return this.prisma.informationWizard.create({
      data: {
        service: { connect: { id: dto.serviceId } },
        statuaryFormPath: dto.statuaryFormPath,
        feeStructurePath: dto.feeStructurePath,
        sopDocumentPath: dto.sopDocumentPath,
        stageWiseTimelinePath: dto.stageWiseTimelinePath,
        statuaryTimelinePath: dto.statuaryTimelinePath,
        statuaryTimelineText: dto.statuaryTimelineText,
        inspectionChecklistPath: dto.inspectionChecklistPath,
        riskCategory: dto.riskCategory,
        sizeOfFirm: dto.sizeOfFirm,
        businessLocation: dto.businessLocation,
        investorType: dto.investorType,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateInformationWizardDto) {
    return this.prisma.informationWizard.update({
      where: { id },
      data: {
        ...(dto.serviceId && { service: { connect: { id: dto.serviceId } } }),
        statuaryFormPath: dto.statuaryFormPath,
        feeStructurePath: dto.feeStructurePath,
        sopDocumentPath: dto.sopDocumentPath,
        stageWiseTimelinePath: dto.stageWiseTimelinePath,
        statuaryTimelinePath: dto.statuaryTimelinePath,
        statuaryTimelineText: dto.statuaryTimelineText,
        inspectionChecklistPath: dto.inspectionChecklistPath,
        riskCategory: dto.riskCategory,
        sizeOfFirm: dto.sizeOfFirm,
        businessLocation: dto.businessLocation,
        investorType: dto.investorType,
        isActive: dto.isActive,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.informationWizard.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const record = await this.findOne(id);
    return this.prisma.informationWizard.update({
      where: { id },
      data: { isActive: !record?.isActive },
    });
  }
}
