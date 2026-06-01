import { PrismaClient, ServiceStatus } from '@prisma/client';
import { normalizeServiceId } from './utils/service-id.util';

// Downstream sources that reference service_id strings
import { fbFormMappingData } from './data/m_fb_form_mapping.data';
import { fbPageMasterData } from './data/m_fb_page_master.data';
import { schemeDefinitionsData } from './data/scheme-definitions.data';
// If/when you seed more workflow rows, you can include:
// import { bo_workflow_config } from './data/bo_workflow_config.data';

type NeededRow = { service_id: string; department_id?: number | string | null };

export async function seedServiceBackfill(prisma: PrismaClient) {
  console.log('🔧 Backfilling missing Services used by mappings/pages/schemes...');

  // 0) Fetch valid departments once so we never insert an invalid FK
  const validDeptIds = new Set(
    (await prisma.department.findMany({ select: { id: true } })).map(d => d.id)
  );

  // 1) Collect every service_id referenced anywhere downstream
  const needed: NeededRow[] = [
    ...fbFormMappingData.map(r => ({ service_id: r.service_id, department_id: r.department_id })),
    ...fbPageMasterData.map(r => ({ service_id: r.service_id })),
    ...schemeDefinitionsData.map(r => ({ service_id: r.service_id })),
    // ...bo_workflow_config.map(r => ({ service_id: r.service_id, department_id: r.department_id })),
  ];

  // 2) Build a map: service_id -> best-effort (validated) departmentId
  const neededMap = new Map<string, number | null>();
  for (const row of needed) {
    const sid = normalizeServiceId(row.service_id);
    if (!sid) continue;

    // Try to use department_id only if it's valid (>0 and exists in m_departments)
    let dep: number | null = null;
    if (row.department_id !== undefined && row.department_id !== null) {
      const n = Number(row.department_id);
      if (Number.isFinite(n) && n > 0 && validDeptIds.has(n)) {
        dep = n;
      }
      // else keep null to avoid FK violation (many mapping rows use 0)
    }

    if (!neededMap.has(sid)) neededMap.set(sid, dep);
  }

  // 3) Compute which service_ids are missing in DB
  const existing = await prisma.service.findMany({ select: { service_id: true } });
  const existingSet = new Set(
    existing.map(s => String(s.service_id ?? '').trim()).filter(Boolean)
  );

  const missing = [...neededMap.keys()].filter(sid => !existingSet.has(sid));

  if (!missing.length) {
    console.log('  ✅ No backfill needed.');
    return;
  }

  console.log(`  ℹ️ Found ${missing.length} missing service_id(s). Creating placeholder Service rows...`);

  // 4) Create placeholders safely (department_id validated above or null)
  for (const sid of missing) {
    const departmentId = neededMap.get(sid) ?? null;

    await prisma.service.upsert({
      where: { service_id: sid },   // service_id is @unique in your schema
      update: {},
      create: {
        service_id: sid,
        department_id: departmentId,             // null if not a valid department
        service_status: ServiceStatus.NOT_APPLICABLE,
        isActive: true,
      },
    });
  }

  console.log(`  ✅ Backfilled ${missing.length} Service row(s).`);
}