import { PrismaClient } from '@prisma/client';
import { normalizeServiceId } from './utils/service-id.util';
import { fbPageMasterData } from './data/m_fb_page_master.data';

const toDate = (v: any) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  // MySQL-style 'YYYY-MM-DD HH:MM:SS' -> ISO-ish
  const s = String(v);
  const iso = s.includes('T') ? s : s.replace(' ', 'T');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

export async function seedFbPageMaster(prisma: PrismaClient) {
  if (!fbPageMasterData?.length) return;

  const rows = fbPageMasterData.map((r: any) => ({
    ...r,
    service_id: normalizeServiceId(r.service_id),
    created: toDate(r.created),
    modified: toDate(r.modified),
  }));

  await prisma.formPageMaster.createMany({
    data: rows as any[],
    skipDuplicates: true,
  });
}
