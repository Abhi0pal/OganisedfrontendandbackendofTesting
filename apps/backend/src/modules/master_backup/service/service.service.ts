import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { Prisma } from '@prisma/client';
import { ServiceStatus } from '@prisma/client';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) { }

  // ========================= FIND ALL =========================
  async findAll(filters?: { isActive?: boolean; search?: string; departmentIds?: number[]; swcsServiceIds?: number[] }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { service_name: { contains: filters.search, mode: 'insensitive' } },
        { nameInHindi: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.departmentIds?.length) {
      where.department_id = { in: filters.departmentIds };
    }

    if (filters?.swcsServiceIds?.length) {
      where.swcs_service_id = { in: filters.swcsServiceIds };
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        issuer: {
          select: {
            id: true,
            name: true,
            isIssuerActive: true,
          },
        },
      },
    });

    return services.map((s) => ({
      ...s,
      department_name: null,
      issuer_name: s.issuer?.name ?? null,
    }));

    // return this.prisma.service.findMany({
    //   where,
    //   orderBy: { id: 'asc' },
    // });
  }

  // ========================= FIND ONE =========================
  async findOne(id: number) {

    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        issuer: {
          select: {
            id: true,
            name: true,
            isIssuerActive: true,
          },
        },
      },
    });

    if (!service) return null;

    return {
      ...service,
      department_name: null,
      issuer_name: service.issuer?.name ?? null,
    };

    // return this.prisma.service.findUnique({
    //   where: { id },
    // });
  }

  // ========================= CREATE =========================
  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        service_id: dto.service_id,
        swcs_service_id: dto.swcs_service_id,
        service_level: dto.service_level,
        document_checklist: dto.document_checklist,
        document_checklist_mapping: dto.document_checklist_mapping,
        document_type_mapping: dto.document_type_mapping,
        document_checkpoint_mapping: dto.document_checkpoint_mapping,
        dms: dto.dms,
        comments: dto.comments,
        service_name: dto.service_name,
        nameInHindi: dto.nameInHindi,
        is_in_SWCS_act: dto.is_in_SWCS_act,
        is_integrated_with_dms: dto.is_integrated_with_dms,
        service_status: dto.service_status as ServiceStatus,
        isActive: dto.isActive,
        user_agent: dto.user_agent,
        ipaddress: dto.ipaddress,
        service_go_live_date: dto.service_go_live_date,
        service_end_date: dto.service_end_date,

        department_id: dto.department_id ?? undefined,
        issuer_id: dto.issuer_id ?? undefined,
      },
    });
  }

  // ========================= GET DMS =========================
  async getDms(serviceId: number) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        service_id: true,
        service_name: true,
        service_status: true,
        dms: true,
        document_checklist_mapping: true,
        document_type_mapping: true,
        document_checkpoint_mapping: true,
      },
    });

    if (!service) return null;

    if (service.dms) {
      return {
        serviceId: service.id,
        serviceStatus: service.service_status,
        serviceName: service.service_name,
        dms: service.dms,
      };
    }

    const migrated = await this.buildDmsFromLegacy(service);
    if (migrated) {
      await this.prisma.service.update({
        where: { id: service.id },
        data: { dms: migrated },
      });
    }

    return {
      serviceId: service.id,
      serviceStatus: service.service_status,
      serviceName: service.service_name,
      dms: migrated,
    };
  }

  async getDmsByServiceId(serviceId: string) {
    if (!serviceId) return null;
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
      select: {
        id: true,
        service_id: true,
        service_name: true,
        service_status: true,
        dms: true,
        document_checklist_mapping: true,
        document_type_mapping: true,
        document_checkpoint_mapping: true,
      },
    });

    if (!service) return null;

    if (service.dms) {
      return {
        serviceId: service.service_id,
        serviceStatus: service.service_status,
        serviceName: service.service_name,
        dms: service.dms,
      };
    }

    const migrated = await this.buildDmsFromLegacy(service);
    if (migrated) {
      await this.prisma.service.update({
        where: { id: service.id },
        data: { dms: migrated },
      });
    }

    return {
      serviceId: service.service_id,
      serviceStatus: service.service_status,
      serviceName: service.service_name,
      dms: migrated,
    };
  }

  // ========================= SAVE DMS =========================
  async saveDms(serviceId: number, dms: any) {
    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        dms,
        updatedAt: new Date(),
      },
    });
  }

  async saveDmsByServiceId(serviceId: string, dms: any) {
    if (!serviceId) return null;
    await this.prisma.service.updateMany({
      where: { service_id: serviceId },
      data: {
        dms,
        updatedAt: new Date(),
      },
    });
    return this.getDmsByServiceId(serviceId);
  }

  private normalizeMapping(value: any) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private toFormatArray(value?: string | null) {
    if (!value) return [];
    return String(value)
      .split(/[,\s]+/)
      .map((item) => item.trim().replace('.', '').toLowerCase())
      .filter(Boolean);
  }

  private async buildDmsFromLegacy(service: {
    id: number;
    service_id: string | null;
    service_name: string | null;
    service_status: any;
    document_checklist_mapping: any;
    document_type_mapping: any;
    document_checkpoint_mapping: any;
  }) {
    const checklistMapping = this.normalizeMapping(service.document_checklist_mapping);
    const typeMapping = this.normalizeMapping(service.document_type_mapping);
    const checkpointMapping = this.normalizeMapping(service.document_checkpoint_mapping);

    if (!checklistMapping.length && !typeMapping.length && !checkpointMapping.length) {
      return null;
    }

    const checklistIds = checklistMapping
      .map((item: any) => Number(item.doc_id))
      .filter((id: number) => Number.isFinite(id));
    const typeIds = typeMapping
      .map((item: any) => Number(item.doc_id))
      .filter((id: number) => Number.isFinite(id));
    const checkpointIds = checkpointMapping
      .flatMap((item: any) => Array.isArray(item.checkpoint_ids) ? item.checkpoint_ids : [])
      .map((id: any) => Number(id))
      .filter((id: number) => Number.isFinite(id));

    const documents = await this.prisma.documentMaster.findMany({
      where: { id: { in: checklistIds } },
      select: {
        id: true,
        documentTypeId: true,
        checklistDocumentName: true,
        checklistDocumentExtension: true,
        checklistDocumentMaxSize: true,
        prescribedDocumentPath: true,
      },
    });

    const typeIdsFromDocs = documents
      .map((doc) => doc.documentTypeId)
      .filter((id): id is number => typeof id === 'number');

    const allTypeIds = Array.from(new Set([...typeIds, ...typeIdsFromDocs]));

    const documentTypes = allTypeIds.length
      ? await this.prisma.documentType.findMany({
        where: { id: { in: allTypeIds } },
        select: { id: true, name: true },
      })
      : [];

    const checkpoints = checkpointIds.length
      ? await this.prisma.documentCheckpoint.findMany({
        where: { id: { in: checkpointIds } },
        select: { id: true, name: true },
      })
      : [];

    const checkpointMap = new Map(checkpoints.map((cp) => [cp.id, cp]));
    const checklistMap = new Map(
      checklistMapping.map((item: any) => [Number(item.doc_id), item])
    );
    const checkpointMappingMap = new Map(
      checkpointMapping.map((item: any) => [Number(item.doc_id), item])
    );
    const typeMap = new Map(documentTypes.map((dt) => [dt.id, dt]));

    const byType = new Map<number, any[]>();
    documents.forEach((doc) => {
      const typeId = doc.documentTypeId ?? 0;
      if (!byType.has(typeId)) byType.set(typeId, []);
      byType.get(typeId)?.push(doc);
    });

    const dmsDocumentTypes = Array.from(new Set([...allTypeIds, ...byType.keys()])).map(
      (typeId) => {
        const type = typeMap.get(typeId) || { id: typeId, name: 'Other' };
        const docs = byType.get(typeId) || [];
        const checklists = docs.map((doc) => {
          const mapping = checklistMap.get(doc.id);
          const checkpointInfo = checkpointMappingMap.get(doc.id);
          const cpIds = Array.isArray(checkpointInfo?.checkpoint_ids)
            ? checkpointInfo.checkpoint_ids
            : [];
          return {
            id: doc.id,
            name: doc.checklistDocumentName,
            isRequired: String(mapping?.is_required || '').toUpperCase() === 'Y',
            maxSizeMb: doc.checklistDocumentMaxSize ?? null,
            allowedFormats: this.toFormatArray(doc.checklistDocumentExtension),
            prescribedFormat: doc.prescribedDocumentPath
              ? {
                fileName: String(doc.prescribedDocumentPath).split('/').pop() || '',
                filePath: doc.prescribedDocumentPath,
              }
              : null,
            checkpoints: cpIds
              .map((id: any) => {
                const cp = checkpointMap.get(Number(id));
                return cp ? { id: cp.id, name: cp.name } : null;
              })
              .filter(Boolean),
            meta: {
              serviceStatus: service.service_status,
              comment: mapping?.doc_comment || '',
              extraFields: {},
            },
          };
        });
        return {
          id: type.id,
          name: type.name,
          checklists,
        };
      }
    );

    return {
      serviceId: service.id,
      serviceStatus: service.service_status,
      documentTypes: dmsDocumentTypes,
    };
  }


  // ========================= UPDATE =========================
  async update(id: number, dto: UpdateServiceDto) {
    const data: Prisma.ServiceUncheckedUpdateInput = {
      service_id: dto.service_id,
      swcs_service_id: dto.swcs_service_id,
      service_level: dto.service_level,
      document_checklist: dto.document_checklist,
      document_checklist_mapping: dto.document_checklist_mapping,
      document_type_mapping: dto.document_type_mapping,
      document_checkpoint_mapping: dto.document_checkpoint_mapping,
      dms: dto.dms,
      comments: dto.comments,
      service_name: dto.service_name,
      nameInHindi: dto.nameInHindi,
      is_in_SWCS_act: dto.is_in_SWCS_act,
      is_integrated_with_dms: dto.is_integrated_with_dms,
      service_status: dto.service_status as ServiceStatus,
      isActive: dto.isActive,
      user_agent: dto.user_agent,
      ipaddress: dto.ipaddress,
      service_go_live_date: dto.service_go_live_date,
      service_end_date: dto.service_end_date,
      department_id: dto.department_id,
      issuer_id: dto.issuer_id,
      updatedAt: new Date(),
    };
    return this.prisma.service.update({ where: { id }, data });
  }

  // ========================= DELETE =========================
  async delete(id: number) {
    return this.prisma.service.delete({
      where: { id },
    });
  }

  // ========================= TOGGLE ACTIVE =========================
  async toggle(id: number) {
    const service = await this.findOne(id);

    return this.prisma.service.update({
      where: { id },
      data: {
        isActive: !service?.isActive,
        updatedAt: new Date(),
      },
    });
  }
}
