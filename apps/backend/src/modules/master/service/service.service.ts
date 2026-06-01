import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { ServiceStatus } from '@prisma/client';

@Injectable()
export class ServiceService {

  constructor(private prisma: PrismaService) { }

  // ================= FIND ALL =================

  async findAll(filters?: {
    isActive?: boolean;
    search?: string;
    departmentIds?: number[];
  }) {

    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [

        {
          service_name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },

        {
          nameInHindi: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },

        {
          module_name_bn: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },

      ];
    }

    if (filters?.departmentIds?.length) {
      where.department_id = {
        in: filters.departmentIds,
      };
    }

    const services = await this.prisma.service.findMany({

      where,

      orderBy: {
        id: 'asc',
      },

      include: {

        issuer: {
          select: {
            id: true,
            name: true,
          },
        },

        act: {
          select: {
            id: true,
          },
        },

      },

    });

    // Fetch department names from master_data (department_id stores master_data.id — the selected department record)
    const deptDataIds = [
      ...new Set(services.map((s) => s.department_id).filter((id): id is number => id != null)),
    ];
    const deptDataRecords = deptDataIds.length > 0
      ? await this.prisma.masterData.findMany({
        where: { id: { in: deptDataIds.map(BigInt) } },
        select: { id: true, data: true },
      })
      : [];
    const deptNameMap = new Map<string, string>(
      deptDataRecords.map((r) => [r.id.toString(), (r.data as any)?.name ?? '']),
    );

    // Fetch tenant/project via raw SQL (stale Prisma client may not know these fields)
    const ids = services.map((s) => s.id);
    const tenantProjectMap: Record<number, { tenantId: number | null; projectId: number | null; popup_data: string | null; enable_preview: boolean; tenantName: string | null; tenantCode: string | null; projectName: string | null; projectCode: string | null }> = {};
    if (ids.length) {
      // Inline IDs directly to avoid Prisma array-param limitations
      const idList = ids.map(Number).filter(Number.isFinite).join(',');
      const rows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT s.id,
               s.tenant_id          AS "tenantId",
               s.project_id         AS "projectId",
               s.popup_data         AS "popup_data",
               s.enable_preview     AS "enable_preview",
               t.name               AS "tenantName",
               t.tenant_id_code     AS "tenantCode",
               p.name               AS "projectName",
               COALESCE(p.project_id_code, p.code) AS "projectCode"
        FROM m_service s
        LEFT JOIN tenants t ON t.id = s.tenant_id
        LEFT JOIN tenant_projects p ON p.id = s.project_id
        WHERE s.id IN (${idList})
      `);
      for (const r of rows) {
        tenantProjectMap[Number(r.id)] = r;
      }
    }

    return services.map((s) => {
      const tp = tenantProjectMap[s.id];
      return {

        ...s,

        // convert DB → old frontend structure

        service_name: s.service_name,

        nameInHindi: s.nameInHindi,

        sub_department: s.sub_department_id
          ? String(s.sub_department_id)
          : '',

        act_name: s.act_id
          ? String(s.act_id)
          : '',

        service_go_live_date: s.service_go_live_date,

        service_end_date: s.service_end_date,

        department_name: s.department_id ? (deptNameMap.get(String(s.department_id)) ?? null) : null,

        issuer_name: s.issuer?.name ?? null,

        sub_department_name: null,

        tenantId: tp?.tenantId ?? null,
        projectId: tp?.projectId ?? null,
        popup_data: tp?.popup_data ?? null,
        enable_preview: tp?.enable_preview ?? false,
        tenant: tp?.tenantName ? { id: tp.tenantId, name: tp.tenantName, tenant_ID: tp.tenantCode } : null,
        project: tp?.projectName ? { id: tp.projectId, name: tp.projectName, project_ID: tp.projectCode, code: tp.projectCode } : null,

      };
    });

  }


  // ================= FIND ONE =================

  async findOne(id: number) {

    const s = await this.prisma.service.findUnique({

      where: { id },

      include: {

        issuer: true,

        act: true,

      },

    });

    if (!s) return null;

    return {

      ...s,

      service_name: s.service_name,

      nameInHindi: s.nameInHindi,

      sub_department: s.sub_department_id
        ? String(s.sub_department_id)
        : '',

      act_name: s.act_id
        ? String(s.act_id)
        : '',

      service_go_live_date: s.service_go_live_date,

      service_end_date: s.service_end_date,

    };

  }

  // ================= FIND BY SERVICE_ID (string) =================
  async findByServiceId(serviceId: string) {

    const s = await this.prisma.service.findFirst({

      where: { service_id: serviceId },

      select: {
        id: true,
        service_id: true,
        service_name: true,
        nameInHindi: true,
        enable_preview: true,
        sub_department_id: true,
        act_id: true,
        service_go_live_date: true,
        service_end_date: true,
        issuer: true,
        act: true,
      },

    });

    if (!s) return null;

    return {

      ...s,

      service_name: s.service_name,

      nameInHindi: s.nameInHindi,

      enable_preview: s.enable_preview,

      sub_department: s.sub_department_id
        ? String(s.sub_department_id)
        : '',

      act_name: s.act_id
        ? String(s.act_id)
        : '',

      service_go_live_date: s.service_go_live_date,

      service_end_date: s.service_end_date,

    };

  }


  // ================= CREATE =================

  async create(dto: CreateServiceDto) {
    // Auto-generate service_id as "{maxBase + 1}.0" if not supplied by frontend
    let serviceId = dto.serviceId || null;
    if (!serviceId) {
      const rows = await this.prisma.$queryRawUnsafe<{ max_base: number }[]>(
        `SELECT MAX(CAST(SPLIT_PART(service_id, '.', 1) AS INTEGER)) AS max_base
         FROM m_service
         WHERE service_id ~ '^[0-9]+\\.?'`,
      );
      const maxBase = Number(rows[0]?.max_base ?? 0);
      serviceId = `${(Number.isFinite(maxBase) ? maxBase : 0) + 1}.0`;
    }

    const created = await this.prisma.service.create({
      data: {
        service_id: serviceId,
        department_id: dto.departmentId,
        sub_department_id:
          dto.subDepartment
            ? Number(dto.subDepartment)
            : null,
        issuer_id: dto.issuerId,
        service_level: dto.serviceLevel,
        comments: dto.comments,
        service_name: dto.serviceName || null,
        nameInHindi: dto.nameInHindi || null,
        service_status:
          dto.serviceStatus?.toUpperCase() as any,
        service_go_live_date:
          dto.serviceGoLiveDate
            ? new Date(dto.serviceGoLiveDate)
            : null,
        service_end_date:
          dto.serviceEndDate
            ? new Date(dto.serviceEndDate)
            : null,
        act_id:
          dto.actName && !isNaN(Number(dto.actName))
            ? Number(dto.actName)
            : null,
        isActive:
          dto.isActive ?? true,
      },
    });

    // Raw SQL for tenant/project/popup_data/enable_preview (Prisma client may not have regenerated yet)
    const tenantId = dto.tenantId ?? null;
    const projectId = dto.projectId ?? null;
    const popupData = dto.popupData ?? null;
    const enablePreview = dto.enablePreview ?? false;
    await this.prisma.$executeRawUnsafe(
      `UPDATE m_service SET tenant_id = $1, project_id = $2, popup_data = $3, enable_preview = $4 WHERE id = $5`,
      tenantId, projectId, popupData, enablePreview, created.id,
    );

    return created;

  }


  // ================= UPDATE =================

  async update(id: number, dto: UpdateServiceDto) {
    await this.prisma.service.update({
      where: { id },
      data: {
        service_id: dto.serviceId,
        department_id: dto.departmentId,
        sub_department_id:
          dto.subDepartment
            ? Number(dto.subDepartment)
            : undefined,
        issuer_id: dto.issuerId,
        service_level: dto.serviceLevel,
        comments: dto.comments,
        service_name: dto.serviceName || undefined,
        nameInHindi: dto.nameInHindi || undefined,
        service_status:
          dto.serviceStatus?.toUpperCase() as any,
        service_go_live_date:
          dto.serviceGoLiveDate
            ? new Date(dto.serviceGoLiveDate)
            : undefined,
        service_end_date:
          dto.serviceEndDate
            ? new Date(dto.serviceEndDate)
            : undefined,
        act_id:
          dto.actName && !isNaN(Number(dto.actName))
            ? Number(dto.actName)
            : undefined,
        isActive:
          dto.isActive,
      },

      // Select only stable columns — excludes tenantId/projectId which may differ
      // between the stale Prisma client and the current DB schema
      select: { id: true },

    });

    const updated = { id };

    // Raw SQL for tenant/project/popup_data/enable_preview (Prisma client may not have regenerated yet)
    const popupDataValue = typeof dto.popupData === 'string' && dto.popupData.trim() ? dto.popupData.trim() : null;
    const enablePreview = dto.enablePreview ?? false;
    await this.prisma.$executeRawUnsafe(
      `UPDATE m_service SET tenant_id = $1, project_id = $2, popup_data = $3, enable_preview = $4 WHERE id = $5`,
      dto.tenantId ?? null, dto.projectId ?? null, popupDataValue, enablePreview, id,
    );

    return updated;

  }



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

    return {

      serviceId: service.id,

      serviceName: service.service_name,

      serviceStatus: service.service_status,

      dms: service.dms,

      document_checklist_mapping: service.document_checklist_mapping,

      document_type_mapping: service.document_type_mapping,

      document_checkpoint_mapping: service.document_checkpoint_mapping,

    };

  }



  async saveDms(serviceId: number, dmsData: any) {

    return this.prisma.service.update({

      where: { id: serviceId },

      data: {

        dms: dmsData,

        updatedAt: new Date(),

      },

    });

  }


  // ================= DMS BY SERVICE_ID =================

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

      .flatMap((item: any) => (Array.isArray(item.checkpoint_ids) ? item.checkpoint_ids : []))

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

    const documentTypes =

      allTypeIds.length

        ? await this.prisma.documentType.findMany({

          where: { id: { in: allTypeIds } },

          select: { id: true, name: true },

        })

        : [];

    const checkpoints =

      checkpointIds.length

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


  // ================= DELETE =================

  async delete(id: number) {

    return this.prisma.service.delete({

      where: { id },

    });

  }


  // ================= TOGGLE =================

  async toggle(id: number) {

    const s = await this.prisma.service.findUnique({

      where: { id },

    });

    return this.prisma.service.update({

      where: { id },

      data: {

        isActive: !s?.isActive,

      },

    });

  }

}
