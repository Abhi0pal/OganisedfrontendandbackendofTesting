import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, OptionSourceType, YnFlag } from '@prisma/client';
import { CreateBuilderFieldDto } from './dto/create-builder-field.dto';
import { UpdateBuilderFieldDto } from './dto/update-builder-field.dto';
import { ReorderBuilderFieldsDto } from './dto/reorder-builder-fields.dto';
import { SaveFieldOptionsDto } from './dto/save-field-options.dto';
import { CreateAddMoreGroupDto } from './dto/create-addmore-group.dto';
import { ListAddMoreGroupsQueryDto } from './dto/list-addmore-groups.dto';
import { SetAddMoreColumnsDto } from './dto/set-addmore-columns.dto';
import { CreateRuleDto, UpdateRuleDto } from './dto/form-rule.dto';
import { UpdateAddMoreGroupDto } from './dto/update-addmore-group.dto';

// OLD DTOs
import { AddPageDto, UpdatePageDto, SavePageCategoriesDto, CreateFormMappingDto } from './dto';

type PreviewOption = { label: string; value: string | number; disabled?: boolean; order?: number };

type MasterOptionsQuery = {
  q?: string;
  take?: number;
  includeInactive?: boolean;
};

@Injectable()
export class FormBuilderService {
  private logger = new Logger(FormBuilderService.name);

  constructor(private readonly prisma: PrismaService) { }

  private normalizeServiceKey(value?: string | null): string {
    return String(value ?? '').trim().replace(/\.0$/, '');
  }

  private resolveInvestorServiceName(
    serviceId?: string | null,
    serviceName?: string | null,
    nameInHindi?: string | null,
  ): string {
    const normalizedServiceId = this.normalizeServiceKey(serviceId);
    return String(serviceName ?? nameInHindi ?? serviceId ?? '').trim() || normalizedServiceId;
  }

  private normalizeLocale(locale?: string): string {
    const normalized = String(locale ?? 'en').trim().toLowerCase();
    if (!normalized) return 'en';
    if (normalized.startsWith('hi')) return 'hi';
    return 'en';
  }

  private asRecord(value: unknown): Record<string, any> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...(value as Record<string, any>) };
    }
    return {};
  }

  private mergeComponentProps(existingValue: unknown, incomingValue: unknown): Record<string, any> {
    const existing = this.asRecord(existingValue);
    const incoming = this.asRecord(incomingValue);
    const merged: Record<string, any> = { ...existing, ...incoming };

    const existingI18n = this.asRecord(existing.i18n);
    const incomingI18n = this.asRecord(incoming.i18n);
    const hasI18n = Object.keys(existingI18n).length > 0 || Object.keys(incomingI18n).length > 0;

    if (hasI18n) {
      merged.i18n = {
        ...existingI18n,
        ...incomingI18n,
        label: {
          ...this.asRecord(existingI18n.label),
          ...this.asRecord(incomingI18n.label),
        },
        placeholder: {
          ...this.asRecord(existingI18n.placeholder),
          ...this.asRecord(incomingI18n.placeholder),
        },
        help_text: {
          ...this.asRecord(existingI18n.help_text),
          ...this.asRecord(incomingI18n.help_text),
        },
      };
    }

    return merged;
  }

  private setLocalizedText(
    componentProps: Record<string, any>,
    key: 'label' | 'placeholder' | 'help_text',
    locale: string,
    value: unknown,
  ): Record<string, any> {
    if (value === undefined) return componentProps;
    const next = this.asRecord(componentProps);
    const i18n = this.asRecord(next.i18n);
    const keyBucket = this.asRecord(i18n[key]);
    keyBucket[locale] = value === null ? '' : String(value);
    i18n[key] = keyBucket;
    next.i18n = i18n;
    return next;
  }

  private pickLocalizedText(
    componentProps: unknown,
    key: 'label' | 'placeholder' | 'help_text',
    localeInput?: string,
    fallbackText?: string | null,
  ): string | null {
    const locale = this.normalizeLocale(localeInput);
    const cp = this.asRecord(componentProps);
    const i18n = this.asRecord(cp.i18n);
    const values = this.asRecord(i18n[key]);

    const direct = values[locale];
    if (typeof direct === 'string' && direct.trim() !== '') return direct;

    const english = values.en;
    if (typeof english === 'string' && english.trim() !== '') return english;

    if (typeof fallbackText === 'string' && fallbackText.trim() !== '') return fallbackText;
    return fallbackText ?? null;
  }

  // =========================================================
  // ✅ LEGACY METHODS (RESTORED FULLY)
  // =========================================================
  async getServicesWithFormsAndPages(departmentId: number) {
    const services = await this.prisma.service.findMany({
      where: { department_id: departmentId, isActive: true },
      select: { id: true, service_id: true, service_name: true },
      orderBy: { id: 'asc' },
    });

    // Fetch tenant/project for these services via raw SQL
    const numericIds = services.map((s) => s.id).filter(Number.isFinite);
    const tenantProjectMap: Record<number, { tenantId: number | null; projectId: number | null; tenantName: string | null; tenantCode: string | null; projectName: string | null; projectCode: string | null }> = {};
    if (numericIds.length) {
      const idList = numericIds.join(',');
      const tpRows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT s.id,
               s.tenant_id          AS "tenantId",
               s.project_id         AS "projectId",
               t.name               AS "tenantName",
               t.tenant_id_code     AS "tenantCode",
               p.name               AS "projectName",
               COALESCE(p.project_id_code, p.code) AS "projectCode"
        FROM m_service s
        LEFT JOIN tenants t ON t.id = s.tenant_id
        LEFT JOIN tenant_projects p ON p.id = s.project_id
        WHERE s.id IN (${idList})
      `);
      for (const r of tpRows) {
        tenantProjectMap[Number(r.id)] = r;
      }
    }

    const rawServiceIds = (services ?? []).map((s) => s.service_id).filter(Boolean) as string[];

    const serviceIds = Array.from(
      new Set(
        rawServiceIds.flatMap((id) => {
          const trimmed = String(id).trim();
          const noDotZero = trimmed.replace(/\.0$/, '');
          return [trimmed, noDotZero];
        }),
      ),
    );

    const mappings = await this.prisma.formMapping.findMany({
      where: {
        OR: [{ department_id: departmentId }, { department_id: 0 }],
        service_id: { in: serviceIds },
        is_active: YnFlag.Y,
      },
      orderBy: [{ department_id: 'desc' }, { modified: 'desc' }, { created: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        department_id: true,
        service_id: true,
        form_type_id: true,
        form_name: true,
        form_code: true,
        tenant_id: true,
        project_id: true,
        role_id: true,
        tenant: { select: { name: true } },
        project: { select: { name: true } },
        role: { select: { name: true } },
      },
    });

    const pages = await this.prisma.formPageMaster.findMany({
      where: { service_id: { in: serviceIds }, is_active: YnFlag.Y },
      select: { service_id: true, form_id: true, tenantId: true, projectId: true, role_id: true },
    });

    const pageCount = new Map<string, number>();
    // For non-Type-2 forms, count by service+form only (no context isolation)
    const pageCountSimple = new Map<string, number>();
    for (const p of pages) {
      const k = `${p.service_id}__${p.form_id}__${p.tenantId ?? 'null'}__${p.projectId ?? 'null'}__${p.role_id ?? 'null'}`;
      pageCount.set(k, (pageCount.get(k) ?? 0) + 1);
      const sk = `${p.service_id}__${p.form_id}`;
      pageCountSimple.set(sk, (pageCountSimple.get(sk) ?? 0) + 1);
    }

    const byService = new Map<string, any[]>();
    for (const m of mappings) {
      const sid = String(m.service_id).trim();
      // Only Type 2 (department/officer forms) needs role-based context isolation
      const isType2 = m.form_type_id === 2;
      const k = isType2
        ? `${sid}__${m.form_type_id}__${m.tenant_id ?? 'null'}__${m.project_id ?? 'null'}__${m.role_id ?? 'null'}`
        : `${sid}__${m.form_type_id}`;

      if (!byService.has(sid)) byService.set(sid, []);

      byService.get(sid)!.push({
        id: m.id,
        formTypeId: m.form_type_id,
        formName: m.form_name,
        formCode: m.form_code,
        pagesCount: isType2 ? (pageCount.get(k) ?? 0) : (pageCountSimple.get(k) ?? 0),
        tenantId: m.tenant_id,
        projectId: m.project_id,
        role_id: m.role_id,
        tenant: m.tenant,
        project: m.project,
        role: m.role,
      });
    }

    return services.map((s, idx) => {
      const sid = String(s.service_id).trim();
      const sidNoDotZero = sid.replace(/\.0$/, '');
      const tp = tenantProjectMap[s.id];
      return {
        id: idx + 1,
        serviceId: sid,
        serviceName: this.resolveInvestorServiceName(sid, s.service_name, null),
        forms: byService.get(sid) ?? byService.get(sidNoDotZero) ?? [],
        tenantId: tp?.tenantId ?? null,
        projectId: tp?.projectId ?? null,
        tenantName: tp?.tenantName ?? null,
        tenantCode: tp?.tenantCode ?? null,
        projectName: tp?.projectName ?? null,
        projectCode: tp?.projectCode ?? null,
      };
    });
  }

  async getInvestorApplyServices(tenantId?: number | null, projectId?: number | null) {
    console.log(`[SERVICE] getInvestorApplyServices called with tenantId=${tenantId}, projectId=${projectId}`);
    this.logger.debug(`[getInvestorApplyServices] Called with tenantId=${tenantId}, projectId=${projectId}`);
    
    const requestedTenantId =
      typeof tenantId === 'number' && Number.isFinite(tenantId) && tenantId > 0
        ? tenantId
        : null;
    const requestedProjectId =
      typeof projectId === 'number' && Number.isFinite(projectId) && projectId > 0
        ? projectId
        : null;
    
    console.log(`[SERVICE] Resolved: requestedTenantId=${requestedTenantId}, requestedProjectId=${requestedProjectId}`);
    this.logger.debug(`[getInvestorApplyServices] Resolved: requestedTenantId=${requestedTenantId}, requestedProjectId=${requestedProjectId}`);

    const services = await this.prisma.service.findMany({
      where: {
        isActive: true,
        AND: [
          requestedTenantId
            ? { OR: [{ tenantId: requestedTenantId }, { tenantId: null }] }
            : { tenantId: null },
          requestedProjectId
            ? { OR: [{ projectId: requestedProjectId }, { projectId: null }] }
            : { projectId: null },
        ],
      },
      select: {
        id: true,
        service_id: true,
        service_name: true,
        nameInHindi: true,
        tenantId: true,
        projectId: true,
      },
      orderBy: { id: 'asc' },
    });
    console.log(`[SERVICE] Found ${services.length} active services`);
    this.logger.debug(`[getInvestorApplyServices] Found ${services.length} active services`);
    if (services.length > 0) {
      console.log(`[SERVICE] Services sample:`, services.slice(0, 2));
      this.logger.debug(`[getInvestorApplyServices] Services: ${JSON.stringify(services.slice(0, 3))}${services.length > 3 ? '...' : ''}`);
    }

    const serviceIdVariants = Array.from(
      new Set(
        services.flatMap((service) => {
          const raw = String(service.service_id ?? '').trim();
          const normalized = this.normalizeServiceKey(raw);
          return raw ? [raw, normalized] : [];
        }),
      ),
    );
    console.log(`[SERVICE] Service ID variants (${serviceIdVariants.length}):`, serviceIdVariants.slice(0, 5));
    this.logger.debug(`[getInvestorApplyServices] Service ID variants (${serviceIdVariants.length}): ${JSON.stringify(serviceIdVariants.slice(0, 5))}${serviceIdVariants.length > 5 ? '...' : ''}`);

    if (serviceIdVariants.length === 0) {
      console.warn(`[SERVICE] ⚠️ No service ID variants found, returning empty array`);
      this.logger.warn(`[getInvestorApplyServices] No service ID variants found, returning empty array`);
      return [];
    }

    const mappings = await this.prisma.formMapping.findMany({
      where: {
        service_id: { in: serviceIdVariants },
        form_type_id: 1,
        is_active: YnFlag.Y,
        role_id: null,
        user_id: null,
        AND: [
          requestedTenantId
            ? { OR: [{ tenant_id: requestedTenantId }, { tenant_id: null }] }
            : { tenant_id: null },
          requestedProjectId
            ? { OR: [{ project_id: requestedProjectId }, { project_id: null }] }
            : { project_id: null },
        ],
      },
      select: {
        service_id: true,
        tenant_id: true,
        project_id: true,
      },
    });
    console.log(`[SERVICE] Found ${mappings.length} form mappings`);
    this.logger.debug(`[getInvestorApplyServices] Found ${mappings.length} form mappings`);
    if (mappings.length > 0) {
      console.log(`[SERVICE] Mappings sample:`, mappings.slice(0, 2));
      this.logger.debug(`[getInvestorApplyServices] Mappings: ${JSON.stringify(mappings.slice(0, 3))}${mappings.length > 3 ? '...' : ''}`);
    }

    const builderFields = await this.prisma.formBuilderField.findMany({
      where: {
        service_id: { in: serviceIdVariants },
        form_id: 1,
        is_active: YnFlag.Y,
        role_id: null,
        user_id: null,
        AND: [
          requestedTenantId
            ? { OR: [{ tenant_id: requestedTenantId }, { tenant_id: null }] }
            : { tenant_id: null },
          requestedProjectId
            ? { OR: [{ project_id: requestedProjectId }, { project_id: null }] }
            : { project_id: null },
        ],
      },
      select: {
        service_id: true,
        tenant_id: true,
        project_id: true,
      },
    });
    console.log(`[SERVICE] Found ${builderFields.length} form builder fields`);
    this.logger.debug(`[getInvestorApplyServices] Found ${builderFields.length} form builder fields`);
    if (builderFields.length > 0) {
      console.log(`[SERVICE] Fields sample:`, builderFields.slice(0, 2));
      this.logger.debug(`[getInvestorApplyServices] Fields: ${JSON.stringify(builderFields.slice(0, 3))}${builderFields.length > 3 ? '...' : ''}`);
    }

    const mappedServiceKeys = new Set(
      mappings.map((mapping) => this.normalizeServiceKey(mapping.service_id)),
    );
    const fieldMappedServiceKeys = new Set(
      builderFields.map((field) => this.normalizeServiceKey(field.service_id)),
    );
    console.log(`[SERVICE] Mapped service keys: ${mappedServiceKeys.size}, Field mapped service keys: ${fieldMappedServiceKeys.size}`);
    this.logger.debug(`[getInvestorApplyServices] Mapped service keys: ${mappedServiceKeys.size}, Field mapped service keys: ${fieldMappedServiceKeys.size}`);

    const bestByServiceKey = new Map<
      string,
      {
        serviceId: string;
        serviceName: string;
        tenantId: number | null;
        projectId: number | null;
      }
    >();

    let includedCount = 0;
    let excludedCount = 0;
    services.forEach((service) => {
      const rawServiceId = String(service.service_id ?? '').trim();
      const serviceKey = this.normalizeServiceKey(rawServiceId);
      if (!rawServiceId || !serviceKey) {
        excludedCount++;
        return;
      }
      if (!mappedServiceKeys.has(serviceKey) || !fieldMappedServiceKeys.has(serviceKey)) {
        console.log(`[SERVICE] Service '${rawServiceId}' (key: ${serviceKey}) excluded - hasMapping: ${mappedServiceKeys.has(serviceKey)}, hasField: ${fieldMappedServiceKeys.has(serviceKey)}`);
        this.logger.debug(`[getInvestorApplyServices] Service '${rawServiceId}' (key: ${serviceKey}) excluded - hasMapping: ${mappedServiceKeys.has(serviceKey)}, hasField: ${fieldMappedServiceKeys.has(serviceKey)}`);
        excludedCount++;
        return;
      }
      includedCount++;

      const displayName = this.resolveInvestorServiceName(
        rawServiceId,
        service.service_name,
        service.nameInHindi,
      );

      const existing = bestByServiceKey.get(serviceKey);
      const isTenantSpecific =
        requestedTenantId !== null && service.tenantId === requestedTenantId;
      const isProjectSpecific =
        requestedProjectId !== null && service.projectId === requestedProjectId;
      const shouldReplace =
        !existing ||
        (isProjectSpecific && existing.projectId !== requestedProjectId) ||
        (isTenantSpecific && existing.tenantId !== requestedTenantId) ||
        (!existing.serviceName && !!displayName);

      if (shouldReplace) {
        bestByServiceKey.set(serviceKey, {
          serviceId: rawServiceId,
          serviceName: displayName,
          tenantId: service.tenantId ?? null,
          projectId: service.projectId ?? null,
        });
      }
    });
    console.log(`[SERVICE] Processing summary - Included: ${includedCount}, Excluded: ${excludedCount}, Final count: ${bestByServiceKey.size}`);
    this.logger.debug(`[getInvestorApplyServices] Processing summary - Included: ${includedCount}, Excluded: ${excludedCount}, Final count: ${bestByServiceKey.size}`);

    const result = Array.from(bestByServiceKey.values()).sort((a, b) =>
      a.serviceName.localeCompare(b.serviceName),
    );
    console.log(`[SERVICE] Returning ${result.length} services`);
    this.logger.debug(`[getInvestorApplyServices] Returning ${result.length} services`);
    if (result.length > 0) {
      console.log(`[SERVICE] Result:`, result);
      this.logger.debug(`[getInvestorApplyServices] Result: ${JSON.stringify(result)}`);
    } else {
      console.warn(`[SERVICE] ⚠️ BLANK RESPONSE - No services matched all criteria`);
      this.logger.warn(`[getInvestorApplyServices] BLANK RESPONSE - No services matched all criteria`);
    }
    return result;
  }

  async previewFormCode(serviceId: string, formTypeId: number) {
    const last = await this.prisma.formMapping.aggregate({
      where: { service_id: serviceId },
      _max: { id: true },
    });
    const nextId = (last._max.id ?? 0) + 1;
    const twoDigit = String(formTypeId).padStart(2, '0');
    const formCode = `UK-SR-${serviceId}_${twoDigit}-FRM-${String(nextId).padStart(2, '0')}`;
    return { formCode };
  }

  async createFormMapping(serviceId: string, dto: CreateFormMappingDto) {
    // Normalize and validate serviceId
    const normalizedServiceId = String(serviceId ?? '').trim();
    if (!normalizedServiceId) {
      throw new BadRequestException('Service ID is required');
    }

    // Verify service exists and get department_id
    const service = await this.prisma.service.findFirst({
      where: { service_id: normalizedServiceId },
      select: { id: true, service_id: true, department_id: true, isActive: true },
    });

    if (!service) {
      throw new NotFoundException(`Service not found for serviceId: ${normalizedServiceId}`);
    }

    if (!service.department_id) {
      throw new BadRequestException(`Service found but department is missing for serviceId: ${normalizedServiceId}`);
    }

    if (!service.isActive) {
      throw new BadRequestException(`Service is inactive for serviceId: ${normalizedServiceId}`);
    }

    const departmentId = service.department_id;

    // Check for existing mapping
    const exists = await this.prisma.formMapping.findFirst({
      where: {
        department_id: departmentId,
        service_id: normalizedServiceId,
        form_type_id: dto.formTypeId,
        tenant_id: dto.tenant_id ?? null,
        project_id: dto.project_id ?? null,
        role_id: dto.role_id ?? null,
        is_active: YnFlag.Y,
      },
    });

    if (exists) throw new BadRequestException('This Form Mapping already exists for the given context.');

    try {
      return await this.prisma.formMapping.create({
        data: {
          department_id: departmentId,
          service_id: normalizedServiceId,
          form_type_id: dto.formTypeId,
          form_name: dto.formName,
          form_code: dto.formCode,
          form_version: dto.formVersion ?? null,
          tenant_id: dto.tenant_id ?? null,
          project_id: dto.project_id ?? null,
          role_id: dto.role_id ?? null,
          user_id: (dto as any).user_id ?? null,
          is_active: YnFlag.Y,
          created: new Date(),
        },
      });
    } catch (error: any) {
      // Catch FK constraint violations and provide better error message
      if (error.code === 'P2003') {
        throw new BadRequestException(
          `Foreign key constraint violation. Ensure service (${normalizedServiceId}), ` +
          `tenant (${dto.tenant_id}), project (${dto.project_id}), and role (${dto.role_id}) exist in the system.`
        );
      }
      throw error;
    }
  }

  async softDeleteFormMapping(serviceId: string, formTypeId: number, mappingId?: number) {
    if (mappingId) {
      await this.prisma.formMapping.update({
        where: { id: mappingId },
        data: { is_active: YnFlag.N, modified: new Date() },
      });
    } else {
      await this.prisma.formMapping.updateMany({
        where: { service_id: serviceId, form_type_id: formTypeId, is_active: YnFlag.Y },
        data: { is_active: YnFlag.N, modified: new Date() },
      });
    }
    return { success: true };
  }

  async getPages(serviceId: string, formTypeId: number, tenantId?: number, projectId?: number, roleId?: number, mappingId?: number) {
    // Only Type 2 (department/officer forms) needs context isolation
    if (formTypeId !== 2) {
      return this.prisma.formPageMaster.findMany({
        where: { service_id: serviceId, form_id: formTypeId, is_active: YnFlag.Y },
        orderBy: { preference: 'asc' },
      });
    }

    let resolvedTenantId = tenantId ?? null;
    let resolvedProjectId = projectId ?? null;
    let resolvedRoleId = roleId ?? null;

    if (mappingId) {
      const mapping = await this.prisma.formMapping.findUnique({ where: { id: mappingId } });
      if (mapping) {
        resolvedTenantId = mapping.tenant_id ?? null;
        resolvedProjectId = mapping.project_id ?? null;
        resolvedRoleId = mapping.role_id ?? null;
      }
    }

    const pages = await this.prisma.formPageMaster.findMany({
      where: {
        service_id: serviceId,
        form_id: formTypeId,
        tenantId: resolvedTenantId,
        projectId: resolvedProjectId,
        role_id: resolvedRoleId,
        is_active: YnFlag.Y,
      },
      orderBy: { preference: 'asc' },
    });

    return pages;
  }

  async addPage(serviceId: string, formTypeId: number, dto: AddPageDto) {
    const max = await this.prisma.formPageMaster.aggregate({
      where: {
        service_id: serviceId,
        form_id: formTypeId,
        tenantId: dto.tenantId ?? null,
        projectId: dto.projectId ?? null,
        role_id: dto.roleId ?? null,
        is_active: YnFlag.Y,
      },
      _max: { preference: true },
    });
    const nextPref = (max._max?.preference ?? 0) + 1;

    const created = await this.prisma.formPageMaster.create({
      data: {
        service_id: serviceId,
        form_id: formTypeId,
        page_name: dto.pageName ?? '',
        name_in_hindi: dto.nameInHindi ?? null,
        form_code: dto.formCode ?? null,
        preference: nextPref,
        tenantId: dto.tenantId ?? null,
        projectId: dto.projectId ?? null,
        role_id: dto.roleId ?? null,
        is_active: YnFlag.Y,
        created: new Date(),
      },
    });

    return created;
  }

  async updatePage(pageId: number, dto: UpdatePageDto) {
    const page = await this.prisma.formPageMaster.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Page not found.');

    return this.prisma.formPageMaster.update({
      where: { id: pageId },
      data: {
        page_name: dto.pageName ?? undefined,
        name_in_hindi: dto.nameInHindi ?? undefined,
        modified: new Date(),
      },
    });
  }

  async softDeletePage(pageId: number) {
    await this.prisma.formPageMaster.update({
      where: { id: pageId },
      data: { is_active: YnFlag.N, modified: new Date() },
    });

    await this.prisma.formPageCategoryMapping.updateMany({
      where: { page_id: pageId, is_active: YnFlag.Y },
      data: { is_active: YnFlag.N },
    });

    return { success: true };
  }

  async getPageCategories(pageId: number) {
    return this.prisma.formPageCategoryMapping.findMany({
      where: { page_id: pageId, is_active: YnFlag.Y },
      orderBy: { preference: 'asc' },
    });
  }

  async savePageCategories(pageId: number, dto: SavePageCategoriesDto) {
    const page = await this.prisma.formPageMaster.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Page not found.');

    await this.prisma.$transaction([
      this.prisma.formPageCategoryMapping.updateMany({
        where: { page_id: pageId, is_active: YnFlag.Y },
        data: { is_active: YnFlag.N },
      }),
      ...(dto.categories ?? []).map((c, idx) =>
        this.prisma.formPageCategoryMapping.create({
          data: {
            page_id: pageId,
            category_id: c.categoryId,
            preference: idx + 1,
            help_text: c.helpText ?? null,
            is_active: YnFlag.Y,
          },
        }),
      ),
    ]);

    return { success: true };
  }

  // =========================================================
  // ✅ NEW: meta for builder header + preview
  // =========================================================
  async getBuilderMeta(serviceId: string, formTypeId: number, mappingId?: number) {
    let mapping: any = null;
    if (mappingId) {
      mapping = await this.prisma.formMapping.findUnique({
        where: { id: mappingId },
        include: { tenant: true, project: true, role: true }
      });
    }

    const [svc, ft] = await Promise.all([
      this.prisma.service.findFirst({
        where: { service_id: serviceId },
        select: { service_id: true, service_name: true, tenantId: true, projectId: true },
      }),
      this.prisma.formType.findUnique({
        where: { id: formTypeId },
        select: { id: true, name: true },
      }),
    ]);

    return {
      serviceId: String(serviceId),
      serviceName: svc?.service_name ?? null,
      formTypeId,
      formTypeName: mapping?.form_name || ft?.name || null,
      tenantId: mapping?.tenant_id || svc?.tenantId || null,
      projectId: mapping?.project_id || svc?.projectId || null,
      roleId: mapping?.role_id || null,
      tenantName: mapping?.tenant?.name || null,
      projectName: mapping?.project?.name || null,
      roleName: mapping?.role?.name || null,
    };
  }

  // =========================================================
  // ✅ NEW: Master table options helper
  // =========================================================
  async getServiceFormFields(serviceId: string) {
    const normalizedServiceId = String(serviceId ?? '').trim();
    if (!normalizedServiceId) {
      return { serviceId: '', fields: [] };
    }

    try {
      // Step 1: Get tenant_id + project_id for this service
      const svcRow = await this.prisma.$queryRawUnsafe<Array<{ tenant_id: number | null; project_id: number | null }>>(
        `SELECT tenant_id, project_id FROM m_service WHERE service_id = $1 LIMIT 1`,
        normalizedServiceId,
      );
      const tenantId = svcRow?.[0]?.tenant_id ?? null;
      const projectId = svcRow?.[0]?.project_id ?? null;

      let rows: Array<{ form_field_id: number | null; formchk_id: string | null; name: string | null }> = [];

      if (tenantId) {
        // Step 2a: Load all form fields for the same tenant + project via page_master
        rows = await this.prisma.$queryRawUnsafe<Array<{ form_field_id: number | null; formchk_id: string | null; name: string | null }>>(
          `
          SELECT DISTINCT
            ff.id AS form_field_id,
            TRIM(ff.formchk_id::text) AS formchk_id,
            COALESCE(ff.name::text, '') AS name
          FROM m_fb_form_builder_fields fb
          INNER JOIN m_fb_form_field ff ON ff.id = fb.form_field_id
          INNER JOIN m_fb_page_master pm ON pm.id = fb.page_id
          WHERE pm.tenant_id = $1
            AND ($2::bigint IS NULL OR pm.project_id = $2)
            AND fb.is_active = 'Y'
            AND pm.is_active = 'Y'
          ORDER BY COALESCE(ff.name::text, '') ASC
          `,
          tenantId,
          projectId,
        );
      }

      // Step 2b: Fallback — load by service_id variants (covers cases with no tenant set)
      if (!rows || rows.length === 0) {
        const baseServiceId = normalizedServiceId.replace(/\.0$/, '');
        const serviceIdVariants = Array.from(
          new Set([normalizedServiceId, baseServiceId, `${baseServiceId}.0`].map((v) => String(v).trim()).filter(Boolean)),
        );
        const placeholders = serviceIdVariants.map((_, index) => `$${index + 1}`).join(', ');

        rows = await this.prisma.$queryRawUnsafe<Array<{ form_field_id: number | null; formchk_id: string | null; name: string | null }>>(
          `
          SELECT DISTINCT
            ff.id AS form_field_id,
            TRIM(ff.formchk_id::text) AS formchk_id,
            COALESCE(ff.name::text, '') AS name
          FROM m_fb_form_builder_fields fb
          INNER JOIN m_fb_form_field ff ON ff.id = fb.form_field_id
          WHERE TRIM(fb.service_id::text) IN (${placeholders})
            AND fb.is_active = 'Y'
          ORDER BY COALESCE(ff.name::text, '') ASC
          `,
          ...serviceIdVariants,
        );
      }

      const fields = (rows ?? [])
        .filter((row) => Boolean(row?.formchk_id))
        .map((row) => ({
          form_field_id: Number(row.form_field_id),
          formchk_id: String(row.formchk_id),
          name: String(row.name ?? ''),
          value: String(row.formchk_id),
          label: String(row.name ?? ''),
        }));

      return {
        serviceId: normalizedServiceId,
        fields,
      };
    } catch (error: any) {
      console.error('[FormBuilderService.getServiceFormFields] Failed:', error?.message || error);
      return {
        serviceId: normalizedServiceId,
        fields: [],
      };
    }
  }

  private async loadMasterOptions(
    masterDefinitionId: number,
    parentValue?: any,
    query?: MasterOptionsQuery,
  ): Promise<PreviewOption[]> {
    // Verify definition exists
    const def = await this.prisma.masterDefinition.findUnique({ where: { id: masterDefinitionId } });
    if (!def) return [];

    const take = typeof query?.take === 'number' && query.take > 0 ? Math.min(query.take, 20000) : 5000;

    const where: any = { master_id: masterDefinitionId, is_active: true };
    const normalizedParentValues =
      parentValue !== undefined && parentValue !== null && parentValue !== ''
        ? Array.isArray(parentValue)
          ? parentValue.flatMap((x) => (typeof x === 'string' ? x.split(',') : [String(x)])).map((x) => String(x).trim()).filter(Boolean)
          : [String(parentValue).trim()].filter(Boolean)
        : [];
    let shouldFilterByParentData = false;
    let triedReferenceFilter = false;
    const parentCodes = [def.parent_master_code]
      .filter((code): code is string => typeof code === 'string' && code.trim().length > 0)
      .map((code) => code.trim().toLowerCase());

    // Cascading: master_data_reference stores child(from_data_id) -> parent(to_data_id).
    // Keep parent -> child support too for older data that may have been generated in the opposite direction.
    if (parentValue !== undefined && parentValue !== null && parentValue !== '') {
      const parentBigInts: bigint[] = normalizedParentValues.reduce<bigint[]>((acc, v) => {
        try { acc.push(BigInt(v)); } catch { /* skip non-numeric */ }
        return acc;
      }, []);

      if (parentBigInts.length > 0) {
        const parentIdSet = new Set(parentBigInts.map((id) => id.toString()));
        const refs = await this.prisma.masterDataReference.findMany({
          where: {
            OR: [
              { to_data_id: { in: parentBigInts } },
              { from_data_id: { in: parentBigInts } },
            ],
          },
          select: { from_data_id: true, to_data_id: true },
        });
        const childIds = Array.from(new Set(
          refs
            .map((r) => (parentIdSet.has(r.to_data_id.toString()) ? r.from_data_id : r.to_data_id))
            .map((id) => id.toString()),
        )).map((id) => BigInt(id));
        if (childIds.length > 0) {
          triedReferenceFilter = true;
          where.id = { in: childIds };
        } else {
          shouldFilterByParentData = true;
        }
      } else {
        shouldFilterByParentData = true;
      }
    }

    let records = await this.prisma.masterData.findMany({
      where,
      select: { id: true, data: true },
      take,
      orderBy: { id: 'asc' },
    });

    if (triedReferenceFilter && records.length === 0 && normalizedParentValues.length > 0) {
      delete where.id;
      shouldFilterByParentData = true;
      records = await this.prisma.masterData.findMany({
        where,
        select: { id: true, data: true },
        take,
        orderBy: { id: 'asc' },
      });
    }

    // Optional in-memory search
    const q = query?.q?.trim();
    if (q) {
      const qLower = q.toLowerCase();
      records = records.filter((r) => String((r.data as any)?.name ?? '').toLowerCase().includes(qLower));
    }

    if (shouldFilterByParentData && normalizedParentValues.length > 0) {
      const parentValueSet = new Set(normalizedParentValues.map((v) => String(v).trim()));
      const candidateKeys = new Set<string>(['parent_id', 'parentId', 'parent_master_id']);
      parentCodes.forEach((code) => {
        const compact = code.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (!compact) return;
        candidateKeys.add(compact);
        candidateKeys.add(`${compact}_id`);
        candidateKeys.add(`${compact}Id`);
      });

      records = records.filter((r) => {
        const data = (r.data as any) ?? {};
        return Array.from(candidateKeys).some((key) => {
          const raw = data?.[key];
          const vals = Array.isArray(raw) ? raw : [raw];
          return vals.some((v) => parentValueSet.has(String(v ?? '').trim()));
        });
      });
    }

    return records.map((r) => ({
      label: (r.data as any)?.name ?? String(r.id),
      value: String(r.id), // BigInt → string for JSON serialisation
    }));
  }

  // =========================================================
  // ✅ GET PREVIEW DEFINITION (The Engine Payload)
  // =========================================================
  async getPreviewDefinition(serviceId: string, formTypeId: number, locale?: string) {
    const normalizedLocale = this.normalizeLocale(locale);
    const meta = await this.getBuilderMeta(serviceId, formTypeId);

    const pages = await this.prisma.formPageMaster.findMany({ where: { service_id: serviceId, form_id: formTypeId, is_active: YnFlag.Y }, orderBy: { preference: 'asc' }, select: { id: true, page_name: true, name_in_hindi: true, preference: true } });
    const pageIds = pages.map((p) => p.id);
    if (pageIds.length === 0) return { meta, pages: [] };

    const pageCats = await this.prisma.formPageCategoryMapping.findMany({ where: { page_id: { in: pageIds }, is_active: YnFlag.Y }, orderBy: [{ page_id: 'asc' }, { preference: 'asc' }], select: { id: true, page_id: true, category_id: true, preference: true, help_text: true } });
    const categoryIds = Array.from(new Set(pageCats.map((c) => c.category_id)));
    const catMasters = await this.prisma.formCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, categoryName: true, nameAlt: true, nameInHindi: true } });
    const catName = new Map<number, { en: string; hi: string | null }>();
    for (const c of catMasters) {
      catName.set(c.id, {
        en: c.categoryName ?? c.nameAlt ?? `Category-${c.id}`,
        hi: c.nameInHindi ?? null,
      });
    }

    const builderFields = await this.prisma.formBuilderField.findMany({ where: { service_id: serviceId, form_id: formTypeId, page_id: { in: pageIds }, category_id: { in: categoryIds }, is_active: YnFlag.Y }, orderBy: [{ page_id: 'asc' }, { category_id: 'asc' }, { preference: 'asc' }], include: { formField: true, optionConfig: true } });

    // ✅ Fetch AddMore Groups
    const addMoreGroups = await this.prisma.formAddMoreGroup.findMany({
      where: { service_id: serviceId, form_id: formTypeId, page_id: { in: pageIds }, category_id: { in: categoryIds }, is_active: YnFlag.Y },
      orderBy: { id: 'desc' },
      include: {
        columns: {
          orderBy: { col_order: 'asc' },
          include: {
            builderField: {
              include: { formField: true, optionConfig: true }
            }
          }
        }
      }
    });

    const masterOptionsCache = new Map<number, any[]>();

    const resolveOptionsForField = async (bf: any) => {
      if (!bf?.optionConfig || bf.optionConfig?.is_active === YnFlag.N) return null;
      if (bf.optionConfig.parent_builder_field_id) return null;

      if (bf.optionConfig.source_type === 'STATIC') {
        try {
          const raw = bf.optionConfig.static_options;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }

      if (bf.optionConfig.source_type === 'MASTER' && bf.optionConfig.master_table_id) {
        const id = bf.optionConfig.master_table_id;
        if (masterOptionsCache.has(id)) return masterOptionsCache.get(id);
        const opts = await this.loadMasterOptions(id, undefined, { includeInactive: true });
        masterOptionsCache.set(id, opts);
        return opts;
      }
      return null;
    };

    const addMoreByTrigger = new Map<number, any[]>();
    for (const g of addMoreGroups) {
      const t = g.trigger_builder_field_id;
      if (!addMoreByTrigger.has(t)) addMoreByTrigger.set(t, []);
      if (g.columns) {
        for (const col of g.columns) {
          // ✅ FIX: Wait for options to resolve for child columns!
          if (col.builderField) {
            (col.builderField as any).resolvedOptions = await resolveOptionsForField(col.builderField);
          }
        }
      }
      addMoreByTrigger.get(t)!.push(g);
    }

    const fieldsByKey = new Map<string, any[]>();
    for (const r of builderFields) {
      const k = `${r.page_id}__${r.category_id}`;
      if (!fieldsByKey.has(k)) fieldsByKey.set(k, []);
      fieldsByKey.get(k)!.push(r);
    }

    // Build Response
    const pagesOut: any[] = [];
    for (const p of pages) {
      const cats = pageCats.filter((c) => c.page_id === p.id);
      const catsOut: any[] = [];
      for (const c of cats) {
        const k = `${p.id}__${c.category_id}`;
        const fields = fieldsByKey.get(k) ?? [];
        const fieldsOut: any[] = [];

        for (const f of fields) {
          const addMore = f.input_type === 'addmore' ? (addMoreByTrigger.get(f.id) ?? []) : [];
          const options = await resolveOptionsForField(f);
          const fieldCode = f.formField?.formCheckId ?? `FIELD-${f.form_field_id}`;
          const masterLabel =
            normalizedLocale === 'hi'
              ? f.formField?.nameInHindi ?? f.formField?.name ?? fieldCode
              : f.formField?.name ?? fieldCode;
          const label = f.custom_label?.trim() ? f.custom_label : masterLabel;

          fieldsOut.push({
            id: f.id,
            preference: f.preference,
            field_code: fieldCode,
            label,
            placeholder: this.pickLocalizedText(
              f.component_props,
              'placeholder',
              normalizedLocale,
              f.placeholder,
            ),
            input_type: f.input_type,
            layout_type: f.layoutType,
            grid_span: f.gridSpan,
            is_required: f.is_required,
            is_editable: f.is_editable,
            is_readonly: f.is_readonly,
            min_length: f.min_length,
            max_length: f.max_length,
            pattern: f.pattern,
            step: f.step,
            help_text: this.pickLocalizedText(
              f.component_props,
              'help_text',
              normalizedLocale,
              f.help_text,
            ),
            validation_rule: f.validation_rule,
            component_props: f.component_props,
            options: options ?? null,
            option_config: f.optionConfig ? {
              source_type: f.optionConfig.source_type,
              master_table_id: f.optionConfig.master_table_id,
              parent_builder_field_id: f.optionConfig.parent_builder_field_id
            } : null,
            add_more_groups: addMore.map((g: any) => ({
              id: g.id,
              label: g.label && g.label.trim() !== '' ? g.label : 'Add More',
              min_rows: g.min_rows ?? 1,
              max_rows: g.max_rows ?? null,
              trigger_builder_field_id: g.trigger_builder_field_id,
              columns: (g.columns ?? []).map((col: any) => {
                const bf = col.builderField;
                const fc = bf?.formField?.formCheckId ?? `FIELD-${bf?.form_field_id ?? col.builder_field_id}`;
                return {
                  id: col.id,
                  builder_field_id: col.builder_field_id,
                  col_order: col.col_order,
                  field_code: fc,
                  label: bf?.custom_label?.trim()
                    ? bf.custom_label
                    : (normalizedLocale === 'hi'
                      ? bf?.formField?.nameInHindi ?? bf?.formField?.name ?? fc
                      : bf?.formField?.name ?? fc),
                  placeholder: this.pickLocalizedText(
                    bf?.component_props,
                    'placeholder',
                    normalizedLocale,
                    bf?.placeholder,
                  ),
                  input_type: bf?.input_type ?? 'text',
                  grid_span: bf?.gridSpan ?? 12,
                  is_required: bf?.is_required ?? YnFlag.N,
                  is_editable: bf?.is_editable ?? YnFlag.Y,
                  is_readonly: bf?.is_readonly ?? YnFlag.N,

                  // ✅ FIX: Added help_text so AddRow fields get their tooltips!
                  help_text: this.pickLocalizedText(
                    bf?.component_props,
                    'help_text',
                    normalizedLocale,
                    bf?.help_text ?? null,
                  ),

                  validation_rule: bf?.validation_rule,
                  min_length: bf?.min_length,
                  max_length: bf?.max_length,
                  pattern: bf?.pattern,

                  options: bf?.resolvedOptions ?? null,

                  option_config: bf?.optionConfig ? {
                    source_type: bf.optionConfig.source_type,
                    master_table_id: bf.optionConfig.master_table_id,
                    parent_builder_field_id: bf.optionConfig.parent_builder_field_id
                  } : null,
                }
              })
            }))
          });
        }
        catsOut.push({
          page_category_mapping_id: c.id,
          category_id: c.category_id,
          category_name:
            normalizedLocale === 'hi'
              ? catName.get(c.category_id)?.hi ?? catName.get(c.category_id)?.en ?? `Category ${c.category_id}`
              : catName.get(c.category_id)?.en ?? `Category ${c.category_id}`,
          preference: c.preference,
          help_text: c.help_text ?? null,
          fields: fieldsOut,
        });
      }
      pagesOut.push({
        id: p.id,
        preference: p.preference,
        page_name:
          normalizedLocale === 'hi'
            ? p.name_in_hindi ?? p.page_name ?? ''
            : p.page_name ?? '',
        name_in_hindi: p.name_in_hindi ?? null,
        categories: catsOut,
      });
    }

    const rules = await this.prisma.formRule.findMany({ where: { service_id: serviceId, form_id: formTypeId, is_active: YnFlag.Y }, orderBy: { id: 'asc' }, select: { id: true, scope: true, when_json: true, then_json: true, is_active: true } });

    return { meta, pages: pagesOut, rules, note: 'Preview only' };
  }

  async getMasterTableOptions(
    masterTableId: number,
    parentValue?: string | string[],
    query?: MasterOptionsQuery,
  ) {
    let normalized: any = parentValue;
    if (typeof parentValue === 'string' && parentValue.includes(',')) {
      normalized = parentValue.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return this.loadMasterOptions(masterTableId, normalized, query);
  }

  // =========================================================
  // ✅ GET BUILDER FIELDS (For Admin Edit Modal)
  // =========================================================
  async getBuilderFields(serviceId: string, formTypeId: number, pageId: number, categoryId: number, locale?: string, mappingId?: number) {
    const normalizedLocale = this.normalizeLocale(locale);

    let contextWhere: any = {};
    if (mappingId) {
      const mapping = await this.prisma.formMapping.findUnique({ where: { id: mappingId } });
      if (mapping) {
        contextWhere = {
          tenant_id: mapping.tenant_id,
          project_id: mapping.project_id,
          role_id: mapping.role_id,
          user_id: mapping.user_id,
        };
      }
    }

    const rows = await this.prisma.formBuilderField.findMany({
      where: {
        service_id: serviceId,
        form_id: formTypeId,
        page_id: pageId,
        category_id: categoryId,
        is_active: YnFlag.Y,
        ...contextWhere
      },
      orderBy: { preference: 'asc' },
      include: { formField: true },
    });

    // ✅ Batch-fetch user emails for any fields with user_id
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))] as number[];
    const userEmailMap = new Map<number, string>();
    if (userIds.length > 0) {
      const users = await this.prisma.users.findMany({
        where: { id: { in: userIds.map(id => BigInt(id)) } },
        select: { id: true, email: true },
      });
      users.forEach(u => userEmailMap.set(Number(u.id), u.email ?? ''));
    }

    return rows.map((r) => ({
      id: r.id,
      preference: r.preference,
      field_code: r.formField?.formCheckId ?? `FIELD-${r.form_field_id}`,
      label: r.custom_label?.trim()
        ? r.custom_label
        : (normalizedLocale === 'hi'
          ? r.formField?.nameInHindi ?? r.formField?.name ?? ''
          : r.formField?.name ?? ''),
      input_type: r.input_type,
      is_required: r.is_required,
      is_active: r.is_active,
      form_field_id: r.form_field_id,
      formField: r.formField,
      // Full property return for Admin UI prefill
      custom_label: r.custom_label,
      help_text: this.pickLocalizedText(
        r.component_props,
        'help_text',
        normalizedLocale,
        r.help_text,
      ),
      placeholder: this.pickLocalizedText(
        r.component_props,
        'placeholder',
        normalizedLocale,
        r.placeholder,
      ),
      is_editable: r.is_editable,
      is_readonly: r.is_readonly,
      min_length: r.min_length,
      max_length: r.max_length,
      pattern: r.pattern,
      step: r.step,
      validation_rule: r.validation_rule,
      component_props: r.component_props,
      i18n: this.asRecord(this.asRecord(r.component_props).i18n),
      layout_type: r.layoutType,
      grid_span: r.gridSpan,
      // ✅ User assignment
      user_id: r.user_id ?? null,
      user_email: r.user_id ? (userEmailMap.get(r.user_id) || null) : null,
    }));
  }

  // =========================================================
  // CREATE BUILDER FIELD (Updated)
  // =========================================================
  async createBuilderField(pageId: number, categoryId: number, dto: CreateBuilderFieldDto) {
    const { serviceId, formTypeId, formFieldId, mappingId } = dto;
    const normalizedLocale = this.normalizeLocale(dto.locale);

    let contextData: any = {};
    if (mappingId) {
      const mapping = await this.prisma.formMapping.findUnique({ where: { id: mappingId } });
      if (mapping) {
        contextData = {
          tenant_id: mapping.tenant_id,
          project_id: mapping.project_id,
          role_id: mapping.role_id,
          user_id: mapping.user_id,
        };
      }
    }
    const hasLocale = typeof dto.locale === 'string' && dto.locale.trim() !== '';
    const shouldWriteLegacyText = !hasLocale || normalizedLocale === 'en';

    const field = await this.prisma.formField.findUnique({ where: { id: formFieldId } });
    if (!field) throw new NotFoundException(`FormField master not found: ${formFieldId}`);

    const existing = await this.prisma.formBuilderField.findFirst({
      where: {
        service_id: serviceId,
        form_id: formTypeId,
        page_id: pageId,
        category_id: categoryId,
        form_field_id: formFieldId,
        ...contextData
      },
      orderBy: { id: 'desc' },
    });

    let preference = dto.preference;
    if (!preference) {
      const maxPref = await this.prisma.formBuilderField.aggregate({
        where: { service_id: serviceId, form_id: formTypeId, page_id: pageId, category_id: categoryId, is_active: YnFlag.Y, ...contextData },
        _max: { preference: true },
      });
      preference = (maxPref._max.preference ?? 0) + 1;
    }

    let componentPropsObject = this.mergeComponentProps({}, dto.componentProps);
    if (hasLocale) {
      componentPropsObject = this.setLocalizedText(
        componentPropsObject,
        'placeholder',
        normalizedLocale,
        dto.placeholder,
      );
      componentPropsObject = this.setLocalizedText(
        componentPropsObject,
        'help_text',
        normalizedLocale,
        dto.helpText,
      );
    }

    const dataPayload: any = {
      // Basic Info
      service_id: serviceId,
      form_id: formTypeId,
      page_id: pageId,
      category_id: categoryId,
      form_field_id: formFieldId,

      // Context scalars
      tenant_id: contextData.tenant_id ?? null,
      project_id: contextData.project_id ?? null,
      role_id: contextData.role_id ?? null,
      user_id: dto.userId !== undefined ? (dto.userId || null) : (contextData.user_id ?? null),

      // Configuration
      preference,
      input_type: dto.inputType,
      custom_label: dto.customLabel ?? null,
      help_text: shouldWriteLegacyText ? dto.helpText ?? null : null,
      placeholder: shouldWriteLegacyText ? dto.placeholder ?? null : null,

      // State Flags
      is_required: dto.isRequired ?? YnFlag.N,
      is_editable: dto.isEditable ?? YnFlag.Y,
      is_readonly: dto.isReadonly ?? YnFlag.N,
      is_active: YnFlag.Y,

      // Validation
      min_length: dto.minLength ?? null,
      max_length: dto.maxLength ?? null,
      pattern: dto.pattern ?? null,
      step: dto.step ?? null,
      validation_rule: dto.validationRule ?? Prisma.DbNull,

      // Layout & Props
      layoutType: dto.layoutType ?? null,
      gridSpan: dto.gridSpan ?? 12,
      component_props:
        Object.keys(componentPropsObject).length > 0
          ? (componentPropsObject as Prisma.InputJsonValue)
          : Prisma.DbNull,
    };

    if (existing && existing.is_active === YnFlag.N) {
      return this.prisma.formBuilderField.update({
        where: { id: existing.id },
        data: { ...dataPayload, modified: new Date() },
      });
    }

    if (existing && existing.is_active === YnFlag.Y) {
      throw new BadRequestException('This field is already added in this page/category.');
    }

    return this.prisma.formBuilderField.create({
      data: dataPayload as Prisma.FormBuilderFieldCreateInput,
    });
  }

  // =========================================================
  // ✅ UPDATE BUILDER FIELD (Updated)
  // =========================================================
  // Replace ONLY this method
  async updateBuilderField(id: number, dto: UpdateBuilderFieldDto) {
    const existing = await this.prisma.formBuilderField.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Builder field not found.');

    const normalizedLocale = this.normalizeLocale(dto.locale);
    const hasLocale = typeof dto.locale === 'string' && dto.locale.trim() !== '';
    const shouldWriteLegacyText = !hasLocale || normalizedLocale === 'en';
    const hasLocalizedTextUpdate =
      hasLocale &&
      (dto.customLabel !== undefined || dto.placeholder !== undefined || dto.helpText !== undefined);

    let mergedComponentProps: Record<string, any> | null = null;
    if (dto.componentProps !== undefined || hasLocalizedTextUpdate) {
      mergedComponentProps = this.mergeComponentProps(existing.component_props, dto.componentProps);
      if (hasLocalizedTextUpdate) {
        mergedComponentProps = this.setLocalizedText(
          mergedComponentProps,
          'placeholder',
          normalizedLocale,
          dto.placeholder,
        );
        mergedComponentProps = this.setLocalizedText(
          mergedComponentProps,
          'help_text',
          normalizedLocale,
          dto.helpText,
        );
      }
    }

    return this.prisma.formBuilderField.update({
      where: { id },
      data: {
        // ✅ FIX: Allow updating the Source Field
        ...(dto.formFieldId ? { formField: { connect: { id: dto.formFieldId } } } : {}),

        input_type: dto.inputType ?? undefined,
        custom_label: dto.customLabel ?? undefined,
        help_text: shouldWriteLegacyText ? dto.helpText ?? undefined : undefined,
        placeholder: shouldWriteLegacyText ? dto.placeholder ?? undefined : undefined,
        is_required: dto.isRequired ?? undefined,
        is_editable: dto.isEditable ?? undefined,
        is_readonly: dto.isReadonly ?? undefined,
        min_length: dto.minLength !== undefined ? dto.minLength : undefined,
        max_length: dto.maxLength !== undefined ? dto.maxLength : undefined,
        pattern: dto.pattern !== undefined ? dto.pattern : undefined,
        step: dto.step !== undefined ? dto.step : undefined,
        validation_rule: dto.validationRule !== undefined ? dto.validationRule : undefined,
        layoutType: dto.layoutType ?? undefined,
        gridSpan: dto.gridSpan ?? undefined,
        component_props:
          mergedComponentProps === null
            ? undefined
            : Object.keys(mergedComponentProps).length > 0
              ? (mergedComponentProps as Prisma.InputJsonValue)
              : Prisma.DbNull,
        preference: dto.preference ?? undefined,
        is_active: dto.isActive ?? undefined,
        // ✅ User-specific field assignment (can be set or cleared to null)
        user_id: dto.userId !== undefined ? (dto.userId || null) : undefined,
        modified: new Date(),
      },
    });
  }

  async softDeleteBuilderField(id: number) {
    const existing = await this.prisma.formBuilderField.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Builder field not found.');

    await this.prisma.$transaction([
      this.prisma.formFieldOptionConfig.updateMany({
        where: { builder_field_id: id },
        data: { is_active: YnFlag.N, modified: new Date() },
      }),
      this.prisma.formBuilderField.update({
        where: { id },
        data: { is_active: YnFlag.N, modified: new Date() },
      }),
    ]);

    return { success: true };
  }

  async reorderBuilderFields(pageId: number, categoryId: number, dto: ReorderBuilderFieldsDto) {
    const ids = dto.items.map((i) => i.id);

    const rows = await this.prisma.formBuilderField.findMany({
      where: { id: { in: ids }, page_id: pageId, category_id: categoryId },
      select: { id: true },
    });

    if (rows.length !== ids.length) {
      throw new BadRequestException('Some field IDs do not belong to this page/category.');
    }

    await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.formBuilderField.update({
          where: { id: i.id },
          data: { preference: i.preference, modified: new Date() },
        }),
      ),
    );

    return { success: true };
  }

  async getFieldOptionConfig(builderFieldId: number) {
    const cfg = await this.prisma.formFieldOptionConfig.findUnique({
      where: { builder_field_id: builderFieldId },
    });
    return cfg ?? null;
  }

  async saveFieldOptionConfig(builderFieldId: number, dto: SaveFieldOptionsDto) {
    const field = await this.prisma.formBuilderField.findUnique({ where: { id: builderFieldId } });
    if (!field) throw new NotFoundException('Builder field not found.');

    // ✅ FIX: Added 'multiselect' to the allowed array to prevent the 400 Error!
    const allowed = ['select', 'radio', 'checkbox', 'multiselect'];
    if (!allowed.includes(field.input_type)) {
      throw new BadRequestException(`Options are only supported for: ${allowed.join(', ')}`);
    }

    if (dto.sourceType === OptionSourceType.MASTER && !dto.masterTableId) {
      throw new BadRequestException('masterTableId is required for MASTER source.');
    }

    if (dto.sourceType === OptionSourceType.STATIC && (!dto.staticOptions || dto.staticOptions.length === 0)) {
      throw new BadRequestException('staticOptions is required for STATIC source.');
    }

    return this.prisma.formFieldOptionConfig.upsert({
      where: { builder_field_id: builderFieldId },
      create: {
        builder_field_id: builderFieldId,
        source_type: dto.sourceType,
        master_table_id: dto.sourceType === OptionSourceType.MASTER ? dto.masterTableId : null,
        static_options: dto.sourceType === OptionSourceType.STATIC ? (dto.staticOptions as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        parent_builder_field_id: dto.parentBuilderFieldId ?? null,
        is_active: YnFlag.Y,
        created: new Date(),
      },
      update: {
        source_type: dto.sourceType,
        master_table_id: dto.sourceType === OptionSourceType.MASTER ? dto.masterTableId : null,
        static_options: dto.sourceType === OptionSourceType.STATIC ? (dto.staticOptions as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        parent_builder_field_id: dto.parentBuilderFieldId ?? null,
        is_active: YnFlag.Y,
        modified: new Date(),
      },
    });
  }

  async createAddMoreGroup(dto: CreateAddMoreGroupDto) {
    const trigger = await this.prisma.formBuilderField.findUnique({ where: { id: dto.triggerBuilderFieldId } });
    if (!trigger) throw new NotFoundException('Trigger builder field not found.');
    if (trigger.input_type !== 'addmore') throw new BadRequestException('Trigger field must be input_type=addmore.');

    return this.prisma.formAddMoreGroup.create({
      data: {
        service_id: dto.serviceId,
        form_id: dto.formTypeId,
        page_id: dto.pageId,
        category_id: dto.categoryId,
        trigger_builder_field_id: dto.triggerBuilderFieldId,
        label: dto.label ?? null,
        min_rows: dto.minRows ?? 1,
        max_rows: dto.maxRows ?? null,
        is_active: YnFlag.Y,
        created: new Date(),
      },
    });
  }

  async listAddMoreGroups(q: ListAddMoreGroupsQueryDto) {
    return this.prisma.formAddMoreGroup.findMany({
      where: {
        service_id: q.serviceId,
        form_id: q.formTypeId,
        page_id: q.pageId,
        category_id: q.categoryId,
        is_active: YnFlag.Y,
        ...(q.triggerBuilderFieldId ? { trigger_builder_field_id: q.triggerBuilderFieldId } : {}),
      },
      include: { columns: { orderBy: { col_order: 'asc' } } },
      orderBy: { id: 'desc' },
    });
  }

  async setAddMoreColumns(groupId: number, dto: SetAddMoreColumnsDto) {
    const group = await this.prisma.formAddMoreGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('AddMore group not found.');

    const cols = await this.prisma.formBuilderField.findMany({
      where: {
        id: { in: dto.columnBuilderFieldIds },
        service_id: group.service_id,
        form_id: group.form_id,
        page_id: group.page_id,
        category_id: group.category_id,
        is_active: YnFlag.Y,
      },
      select: { id: true },
    });

    if (cols.length !== dto.columnBuilderFieldIds.length) {
      throw new BadRequestException('Some column fields are not valid for this AddMore group scope.');
    }

    await this.prisma.$transaction([
      this.prisma.formAddMoreColumn.deleteMany({ where: { group_id: groupId } }),
      ...dto.columnBuilderFieldIds.map((fid, idx) =>
        this.prisma.formAddMoreColumn.create({
          data: { group_id: groupId, builder_field_id: fid, col_order: idx + 1 },
        }),
      ),
    ]);

    return { success: true };
  }

  async softDeleteAddMoreGroup(groupId: number) {
    const group = await this.prisma.formAddMoreGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('AddMore group not found.');

    await this.prisma.$transaction([
      this.prisma.formAddMoreColumn.deleteMany({ where: { group_id: groupId } }),
      this.prisma.formAddMoreGroup.update({
        where: { id: groupId },
        data: { is_active: YnFlag.N, modified: new Date() },
      }),
    ]);

    return { success: true };
  }

  async getRules(serviceId: string, formTypeId: number) {
    return this.prisma.formRule.findMany({
      where: { service_id: serviceId, form_id: formTypeId, is_active: YnFlag.Y },
      orderBy: { id: 'desc' },
    });
  }

  async createRule(serviceId: string, formTypeId: number, dto: any) { // Changed type to 'any' to accept both

    // ✅ FIX: Handle both camelCase (DTO) and snake_case (Raw Body)
    const whenJson = dto.whenJson || dto.when_json;
    const thenJson = dto.thenJson || dto.then_json;

    if (!whenJson || !thenJson) {
      throw new BadRequestException("Rule condition (when) and action (then) are required.");
    }

    return this.prisma.formRule.create({
      data: {
        service_id: serviceId,
        form_id: formTypeId,
        scope: dto.scope,
        when_json: whenJson, // ✅ Correct
        then_json: thenJson, // ✅ Correct
        is_active: dto.isActive ?? YnFlag.Y,
        created: new Date(),
      },
    });
  }

  async updateRule(ruleId: number, dto: any) {
    const rule = await this.prisma.formRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Rule not found.');

    // ✅ FIX: Handle both casings
    const whenJson = dto.whenJson ?? dto.when_json ?? undefined;
    const thenJson = dto.thenJson ?? dto.then_json ?? undefined;

    return this.prisma.formRule.update({
      where: { id: ruleId },
      data: {
        scope: dto.scope ?? undefined,
        when_json: whenJson,
        then_json: thenJson,
        is_active: dto.isActive ?? undefined,
        modified: new Date(),
      },
    });
  }

  async softDeleteRule(ruleId: number) {
    // ... (Keep existing implementation)
    const rule = await this.prisma.formRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Rule not found.');

    await this.prisma.formRule.update({
      where: { id: ruleId },
      data: { is_active: YnFlag.N, modified: new Date() },
    });

    return { success: true };
  }

  // Accept `dto: any` to ensure no properties are stripped by validation pipes
  async updateAddMoreGroup(groupId: number, dto: any) {
    const group = await this.prisma.formAddMoreGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('AddMore group not found.');

    // Ensure the label is explicitly extracted from the payload
    const newLabel = dto.label !== undefined ? dto.label : group.label;

    return this.prisma.formAddMoreGroup.update({
      where: { id: groupId },
      data: {
        label: newLabel,
        min_rows: dto.minRows ?? undefined,
        max_rows: dto.maxRows ?? undefined,
        modified: new Date(),
      },
    });
  }
}

