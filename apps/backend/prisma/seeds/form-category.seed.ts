
import { PrismaClient } from '@prisma/client';
import { formCategoriesData } from './data/form-categories.data';

export async function seedFormCategories(prisma: PrismaClient) {
  if (!formCategoriesData?.length) {
    console.log('  ⚠️ No form categories to seed.');
    return;
  }

  const seen = new Set<string>();
  const roots: any[] = [];
  const children: any[] = [];
  const duplicates: any[] = [];

  const yn = (v?: string) => (v ? v === 'Y' : true);
  const toDate = (d?: string | null) =>
    !d || d === '0000-00-00 00:00:00' ? null : new Date(d);

  for (const r of formCategoriesData) {
    const key = r.category_code;
    if (seen.has(key)) { duplicates.push(r); continue; }
    seen.add(key);

    const row = {
      id: r.id,
      categoryName: r.category_name,
      nameInHindi: r.name_in_hindi || null,
      nameAlt: r.name || null,
      parentId: r.parent_id ?? 0,
      categoryCode: r.category_code,
      isActive: yn(r.is_active),
      created: toDate(r.created),
      modified: toDate(r.modified),
    };
    (row.parentId > 0 ? children : roots).push(row);
  }

  console.log(`  ✅ FormCategories (unique): ${roots.length + children.length}`);
  if (duplicates.length) {
    console.log('  ⚠️ Skipped duplicate category_code(s):');
    for (const d of duplicates) {
      console.log(`   - ${d.category_code} (id=${d.id}, name="${d.category_name}")`);
    }
  }

  if (roots.length) await prisma.formCategory.createMany({ data: roots, skipDuplicates: true });
  if (children.length) await prisma.formCategory.createMany({ data: children, skipDuplicates: true });

  console.log(`  ✅ Seeded categories: roots=${roots.length}, children=${children.length}`);
}
