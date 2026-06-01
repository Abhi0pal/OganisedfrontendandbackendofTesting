import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) { }

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
      select: { service_id: true, service_name: true },
      orderBy: { id: 'asc' },
    });

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
        department_id: true,
        service_id: true,
        form_type_id: true,
        form_name: true,
        form_code: true,
      },
    });

    const pages = await this.prisma.formPageMaster.findMany({
      where: { service_id: { in: serviceIds }, is_active: YnFlag.Y },
      select: { service_id: true, form_id: true },
    });

    const pageCount = new Map<string, number>();
    for (const p of pages) {
      const k = `${p.service_id}__${p.form_id}`;
      pageCount.set(k, (pageCount.get(k) ?? 0) + 1);
    }

    const byService = new Map<string, any[]>();
    const seen = new Set<string>();

    for (const m of mappings) {
      const sid = String(m.service_id).trim();
      const uniqueKey = `${sid}__${m.form_type_id}`;

      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      if (!byService.has(sid)) byService.set(sid, []);
      const k = `${sid}__${m.form_type_id}`;

      byService.get(sid)!.push({
        formTypeId: m.form_type_id,
        formName: m.form_name,
        formCode: m.form_code,
        pagesCount: pageCount.get(k) ?? 0,
      });
    }

    return services.map((s, idx) => {
      const sid = String(s.service_id).trim();
      const sidNoDotZero = sid.replace(/\.0$/, '');
      return {
        id: idx + 1,
        serviceId: sid,
        serviceName: s.service_name,
        forms: byService.get(sid) ?? byService.get(sidNoDotZero) ?? [],
      };
    });
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
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
      select: { department_id: true },
    });

    if (!service || !service.department_id) {
      throw new NotFoundException(`Service not found or department missing for serviceId: ${serviceId}`);
    }

    const departmentId = service.department_id;

    const exists = await this.prisma.formMapping.findFirst({
      where: {
        department_id: departmentId,
        service_id: serviceId,
        form_type_id: dto.formTypeId,
        is_active: YnFlag.Y,
      },
    });

    if (exists) throw new BadRequestException('This Form Type is already mapped to this Service.');

    return this.prisma.formMapping.create({
      data: {
        department_id: departmentId,
        service_id: serviceId,
        form_type_id: dto.formTypeId,
        form_name: dto.formName,
        form_code: dto.formCode,
        form_version: dto.formVersion ?? null,
        is_active: YnFlag.Y,
        created: new Date(),
      },
    });
  }

  async softDeleteFormMapping(serviceId: string, formTypeId: number) {
    await this.prisma.formMapping.updateMany({
      where: { service_id: serviceId, form_type_id: formTypeId, is_active: YnFlag.Y },
      data: { is_active: YnFlag.N, modified: new Date() },
    });
    return { success: true };
  }

  async getPages(serviceId: string, formTypeId: number) {
    return this.prisma.formPageMaster.findMany({
      where: { service_id: serviceId, form_id: formTypeId, is_active: YnFlag.Y },
      orderBy: { preference: 'asc' },
    });
  }

  async addPage(serviceId: string, formTypeId: number, dto: AddPageDto) {
    const max = await this.prisma.formPageMaster.aggregate({
      where: { service_id: serviceId, form_id: formTypeId, is_active: YnFlag.Y },
      _max: { preference: true },
    });
    const nextPref = (max._max.preference ?? 0) + 1;

    return this.prisma.formPageMaster.create({
      data: {
        service_id: serviceId,
        form_id: formTypeId,
        page_name: dto.pageName ?? '',
        name_in_hindi: dto.nameInHindi ?? null,
        form_code: dto.formCode ?? null,
        preference: nextPref,
        is_active: YnFlag.Y,
        created: new Date(),
      },
    });
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
  async getBuilderMeta(serviceId: string, formTypeId: number) {
    const [svc, ft] = await Promise.all([
      this.prisma.service.findFirst({
        where: { service_id: serviceId },
        select: { service_id: true, service_name: true },
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
      formTypeName: ft?.name ?? null,
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
      const baseServiceId = normalizedServiceId.replace(/\.0$/, '');
      const serviceIdVariants = Array.from(
        new Set([normalizedServiceId, baseServiceId, `${baseServiceId}.0`].map((v) => String(v).trim()).filter(Boolean)),
      );
      const placeholders = serviceIdVariants.map((_, index) => `$${index + 1}`).join(', ');

      const rows = await this.prisma.$queryRawUnsafe<Array<{ formchk_id: string | null; name: string | null }>>(
        `
        SELECT DISTINCT
          TRIM(ff.formchk_id::text) AS formchk_id,
          COALESCE(ff.name::text, '') AS name
        FROM m_fb_form_builder_fields fb
        INNER JOIN m_fb_form_field ff ON ff.id = fb.form_field_id
        WHERE TRIM(fb.service_id::text) IN (${placeholders})
        ORDER BY COALESCE(ff.name::text, '') ASC
        `,
        ...serviceIdVariants,
      );

      const fields = (rows ?? [])
        .filter((row) => Boolean(row?.formchk_id))
        .map((row) => ({
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
    masterTableId: number,
    parentValue?: any,
    query?: MasterOptionsQuery,
  ): Promise<PreviewOption[]> {
    const mt = await this.prisma.master_tables.findUnique({
      where: { id: masterTableId },
      select: {
        id: true,
        master_code: true,
        table_name: true,
        schema_name: true,
        value_column: true,
        label_column: true,
        secondary_label: true,
        label_template: true,
        is_active_column: true,
        is_active_value: true,
        default_filter: true,
        default_order_by: true,
        parent_column: true,
      },
    });

    if (!mt) return [];

    const cleanIdent = (v: string) => String(v ?? '').replace(/"/g, '').trim();
    const isSafeIdent = (v: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v);

    const schema = cleanIdent(mt.schema_name ?? 'public');
    const table = cleanIdent(mt.table_name ?? '');
    const valueCol = cleanIdent(mt.value_column ?? '');
    const labelCol = cleanIdent(mt.label_column ?? '');
    const secondaryLabel = mt.secondary_label ? cleanIdent(mt.secondary_label) : null;
    const activeCol = mt.is_active_column ? cleanIdent(mt.is_active_column) : null;
    const activeVal = mt.is_active_value ? String(mt.is_active_value) : null;
    const parentCol = mt.parent_column ? cleanIdent(mt.parent_column) : null;

    if (!schema || !table || !valueCol || !labelCol) return [];
    if (![schema, table, valueCol, labelCol].every(isSafeIdent)) return [];

    const whereClauses: string[] = [];
    const params: any[] = [];

    const masterCode = String(mt.master_code ?? '').toUpperCase();
    const includeInactive = query?.includeInactive === true || masterCode === 'COUNTRY' || masterCode === 'STATE';

    if (!includeInactive && activeCol && activeVal) {
      params.push(activeVal);
      whereClauses.push(`"${activeCol}"::text = $${params.length}`);
    }

    if (mt.default_filter && typeof mt.default_filter === 'object') {
      const df = mt.default_filter as any;
      for (const [k, v] of Object.entries(df)) {
        const col = cleanIdent(k);
        if (!isSafeIdent(col)) continue;
        params.push(v);
        whereClauses.push(`"${col}" = $${params.length}`);
      }
    }

    if (parentCol && parentValue !== undefined && parentValue !== null && parentValue !== '') {
      if (Array.isArray(parentValue)) {
        const vals = parentValue
          .flatMap((x) => (typeof x === 'string' ? x.split(',') : [x]))
          .map((x) => (typeof x === 'string' ? x.trim() : x))
          .filter((x) => x !== '' && x !== null && x !== undefined);
        if (vals.length) {
          const placeholders: string[] = [];
          for (const v of vals) {
            params.push(String(v));
            placeholders.push(`$${params.length}`);
          }
          whereClauses.push(`"${parentCol}"::text IN (${placeholders.join(', ')})`);
        }
      } else {
        params.push(String(parentValue));
        whereClauses.push(`"${parentCol}"::text = $${params.length}`);
      }
    }

    const q = query?.q?.trim();
    if (q) {
      params.push(`%${q}%`);
      const p = `$${params.length}`;
      if (secondaryLabel) {
        whereClauses.push(`("${labelCol}"::text ILIKE ${p} OR "${secondaryLabel}"::text ILIKE ${p})`);
      } else {
        whereClauses.push(`"${labelCol}"::text ILIKE ${p}`);
      }
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderBy = mt.default_order_by && mt.default_order_by.trim() ? mt.default_order_by : `"${labelCol}" ASC`;

    const labelExpr = secondaryLabel
      ? `(COALESCE("${labelCol}"::text, '') || ' (' || COALESCE("${secondaryLabel}"::text, '') || ')') AS label`
      : `"${labelCol}"::text AS label`;

    const take = typeof query?.take === 'number' && query.take > 0 ? Math.min(query.take, 20000) : 5000;

    const sql = `
      SELECT "${valueCol}"::text AS value, ${labelExpr}
      FROM "${schema}"."${table}"
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${take}
    `;

    try {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
      return (rows ?? []).map((r) => ({
        label: r?.label ?? String(r?.value ?? ''),
        value: r?.value,
      }));
    } catch {
      return [];
    }
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
  async getBuilderFields(serviceId: string, formTypeId: number, pageId: number, categoryId: number, locale?: string) {
    const normalizedLocale = this.normalizeLocale(locale);
    const rows = await this.prisma.formBuilderField.findMany({
      where: {
        service_id: serviceId,
        form_id: formTypeId,
        page_id: pageId,
        category_id: categoryId,
        is_active: YnFlag.Y,
      },
      orderBy: { preference: 'asc' },
      include: { formField: true },
    });

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
    }));
  }

  // =========================================================
  // CREATE BUILDER FIELD (Updated)
  // =========================================================
  async createBuilderField(pageId: number, categoryId: number, dto: CreateBuilderFieldDto) {
    const { serviceId, formTypeId, formFieldId } = dto;
    const normalizedLocale = this.normalizeLocale(dto.locale);
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
      },
      orderBy: { id: 'desc' },
    });

    let preference = dto.preference;
    if (!preference) {
      const maxPref = await this.prisma.formBuilderField.aggregate({
        where: { service_id: serviceId, form_id: formTypeId, page_id: pageId, category_id: categoryId, is_active: YnFlag.Y },
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

    const dataPayload: Prisma.FormBuilderFieldCreateInput | Prisma.FormBuilderFieldUpdateInput = {
      // Basic Info
      service_id: serviceId,
      form_id: formTypeId,
      page_id: pageId,
      category_id: categoryId,
      formField: { connect: { id: formFieldId } },

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
        min_length: dto.minLength ?? undefined,
        max_length: dto.maxLength ?? undefined,
        pattern: dto.pattern ?? undefined,
        step: dto.step ?? undefined,
        validation_rule: dto.validationRule ?? undefined,
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

