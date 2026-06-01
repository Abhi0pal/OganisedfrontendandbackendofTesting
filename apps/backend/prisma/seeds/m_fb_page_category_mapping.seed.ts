import { PrismaClient } from '@prisma/client';
import { fbPageCategoryMappingData } from './data/m_fb_page_category_mapping.data';

const toDate = (v: any) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  // MySQL-style 'YYYY-MM-DD HH:MM:SS' -> ISO-ish
  const s = String(v);
  const iso = s.includes('T') ? s : s.replace(' ', 'T');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

export async function seedFbPageCategoryMapping(prisma: PrismaClient) {
  if (!fbPageCategoryMappingData?.length) return;
  const rows = fbPageCategoryMappingData.map((r: any) => ({ ...r }));
  await prisma.formPageCategoryMapping.createMany({
    data: rows as any[],
    skipDuplicates: true,
  });
}
