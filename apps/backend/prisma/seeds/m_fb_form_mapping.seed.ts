import { Prisma, PrismaClient, YnFlag } from '@prisma/client';
import { normalizeServiceId } from './utils/service-id.util';
import { fbFormMappingData } from './data/m_fb_form_mapping.data';

const toDate = (v: any) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  if (!s || s === 'null' || s === 'undefined' || s.startsWith('0000-00-00')) {
    return null;
  }
  const iso = s.includes('T') ? s : s.replace(' ', 'T');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

// --------------------------------------------------------------
// Convention B:
// UK-SR-<svc_padded>-FRM-<pk>_<type2>
// --------------------------------------------------------------
const formatServiceIdForCode = (serviceId: string) => {
  const s = String(serviceId ?? '').trim();
  const [intRaw, decRaw] = s.split('.');
  const intPart = String(parseInt(intRaw || '0', 10)).padStart(3, '0');
  const decPart = String(decRaw ?? '0').padEnd(2, '0').slice(0, 2);
  return `${intPart}_${decPart}`;
};

const formatFormTypeId = (formTypeId: number) => String(formTypeId).padStart(2, '0');

const buildExpectedCode = (serviceId: string, mappingPk: number, formTypeId: number) => {
  return `UK-SR-${formatServiceIdForCode(serviceId)}-FRM-${mappingPk}_${formatFormTypeId(formTypeId)}`;
};

const normalizeIsActive = (v: any): YnFlag =>
  String(v ?? 'Y').toUpperCase() === 'Y' ? YnFlag.Y : YnFlag.N;

type AnyRow = Record<string, any>;

function pickWinner(rows: AnyRow[]) {
  const scored = rows.map((r) => {
    const activeScore = normalizeIsActive(r.is_active) === YnFlag.Y ? 1 : 0;
    const d = toDate(r.modified) ?? toDate(r.created) ?? new Date(0);
    const timeScore = d.getTime();
    const idScore = Number(r.id ?? 0) || 0;
    return { r, activeScore, timeScore, idScore };
  });

  scored.sort((a, b) => {
    // 1) Prefer is_active='Y'
    if (b.activeScore !== a.activeScore) return b.activeScore - a.activeScore;
    // 2) Prefer most recent modified/created
    if (b.timeScore !== a.timeScore) return b.timeScore - a.timeScore;
    // 3) Prefer highest id
    return b.idScore - a.idScore;
  });

  return scored[0]?.r ?? rows[0];
}

export async function seedFbFormMapping(prisma: PrismaClient) {
  if (!fbFormMappingData?.length) return;

  // --- Preflight: ensure all mapping service_ids exist in m_service.service_id ---
  const dbServices = await prisma.service.findMany({ select: { service_id: true } });
  const serviceIdsInDb = new Set(
    dbServices.map(s => String(s.service_id ?? '').trim()).filter(Boolean)
  );
  const mappingServiceIds = new Set(
    (fbFormMappingData as any[])
      .map(r => normalizeServiceId(r.service_id))
      .filter(Boolean)
  );
  const missing = [...mappingServiceIds].filter(id => !serviceIdsInDb.has(id));
  if (missing.length) {
    console.warn(`\n[m_fb_form_mapping.seed] ❗ ${missing.length} service_id(s) not found in m_service:`);
    console.warn(missing.slice(0, 25));
    throw new Error('Aborting: Some FormMapping.service_id values do not exist in m_service.');
  }

  const warnings: string[] = [];
  const now = new Date();

  // 1) Group by UNIQUE triplet: (department_id, service_id, form_type_id)
  const groups = new Map<string, AnyRow[]>();

  for (const raw of fbFormMappingData as AnyRow[]) {
    const departmentId = Number(raw.department_id ?? 0);
    const serviceId = normalizeServiceId(raw.service_id);
    const formTypeId = Number(raw.form_type_id);
    const id = Number(raw.id);

    if (!serviceId || !Number.isFinite(formTypeId) || !Number.isFinite(id)) {
      warnings.push(
        `[m_fb_form_mapping.seed] INVALID_ROW id=${raw.id} department_id=${raw.department_id} service_id="${raw.service_id}" form_type_id="${raw.form_type_id}"`,
      );
      continue;
    }

    const key = `${departmentId}__${serviceId}__${formTypeId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(raw);
  }

  // 2) For each group, select a winner and upsert on the compound unique key
  for (const [key, rows] of groups.entries()) {
    const winner = pickWinner(rows);

    const departmentId = Number(winner.department_id ?? 0);
    const serviceId = normalizeServiceId(winner.service_id);
    const formTypeId = Number(winner.form_type_id);
    const winnerId = Number(winner.id);

    if (rows.length > 1) {
      const ids = rows.map((x) => x.id).join(', ');
      const flags = rows.map((x) => `${x.id}:${normalizeIsActive(x.is_active)}`).join(', ');
      warnings.push(
        `[m_fb_form_mapping.seed] DUPLICATE_UNIQUE_TRIPLET key=${key} ids=[${ids}] is_active=[${flags}] => WINNER=${winnerId}`,
      );
    }

    const created = toDate(winner.created) ?? now;
    const modified = toDate(winner.modified);

    const formName = String(winner.form_name ?? '').trim();
    if (!formName) {
      warnings.push(`[m_fb_form_mapping.seed] MISSING_FORM_NAME key=${key} winnerId=${winnerId}`);
      continue;
    }

    // ✅ Upsert by compound unique key to avoid wrong-row updates
    const expectedCode = buildExpectedCode(serviceId, winnerId, formTypeId);
    const is_active = normalizeIsActive(winner.is_active);

    const createData: Prisma.FormMappingUncheckedCreateInput = {
      // Keep deterministic ID if possible after reset
      id: winnerId,
      department_id: departmentId,
      service_id: serviceId,
      form_type_id: formTypeId,
      form_name: formName,
      form_code: expectedCode,
      form_version: winner.form_version ?? null,
      is_active,
      created,
      modified: modified ?? null,
      tenant_id: winner.tenant_id ?? null,
      project_id: winner.project_id ?? null,
      role_id: winner.role_id ?? null,
      user_id: winner.user_id ?? null,
    };

    const updateData: Prisma.FormMappingUncheckedUpdateInput = {
      department_id: departmentId,
      service_id: serviceId,
      form_type_id: formTypeId,
      form_name: formName,
      form_code: expectedCode,
      form_version: winner.form_version ?? null,
      is_active,
      created,
      modified: modified ?? null,
      tenant_id: winner.tenant_id ?? null,
      project_id: winner.project_id ?? null,
      role_id: winner.role_id ?? null,
      user_id: winner.user_id ?? null,
    };

    await prisma.formMapping.upsert({
      where: { id: winnerId },
      create: createData,
      update: updateData,
    });
  }

  // 3) Echo warnings
  if (warnings.length) {
    console.warn(`[m_fb_form_mapping.seed] Completed with ${warnings.length} warning(s).`);
    console.warn(warnings.join('\n'));
  }
}