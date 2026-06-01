
import { PrismaClient } from '@prisma/client';
import { formFieldsData } from './data/form-fields.data';

/**
 * Seed FormField
 * - De-dupes by formchk_id (keeps first)
 * - Maps legacy category_id=0 → null to avoid FK violation
 * - Preserves other legacy fields for fidelity (hindi/editable/dates), even if runtime create() doesn’t use them
 * - Uses createMany once duplicates are filtered
 */
export async function seedFormFields(prisma: PrismaClient) {
  try {
    if (!formFieldsData?.length) {
      console.log('  ⚠️ No form fields to seed.');
      return;
    }

    console.log(`  🔍 Total entries in source data: ${formFieldsData.length}`);

    const seen = new Set<string>();
    const uniquePayload: any[] = [];
    const duplicates: any[] = [];

    // Helpers
    const toBool = (v?: string) => (v ? v === 'Y' : true);
    const toDate = (d?: string | null) =>
      !d || d === '0000-00-00 00:00:00' ? null : new Date(d);

    // Pass #1 — detect duplicates BEFORE seeding
    for (const row of formFieldsData) {
      const key = row.formchk_id;

      if (!key) {
        // Skip rows without a code; echo once
        console.log(`  ⚠️ Skipping row without formchk_id (legacy id: ${row.formvar_id ?? 'N/A'})`);
        continue;
      }

      if (seen.has(key)) {
        duplicates.push(row);
        continue;
      }
      seen.add(key);

      // Map legacy 0 category -> null (FK-safe)
      const mappedCategoryId =
        row.category_id && row.category_id !== 0 ? row.category_id : null;

      uniquePayload.push({
        // NOTE: If you want to preserve legacy numeric id, you can set id: row.formvar_id,
        // but then you must ensure no collision and sequence reset to MAX(id)+1 afterward.
        formCheckId: row.formchk_id,
        parentId: row.parent_id ?? 0,
        categoryId: mappedCategoryId, // <-- critical change to avoid FK violation
        name: (row.name ?? '').trim(),
        nameInHindi: row.name_in_hindi ?? null,
        isEditable: row.is_editable ?? 'Y',
        createdDate: toDate(row.created_date),
        isActive: toBool(row.is_formvar_active),
      });
    }

    console.log(`  ✅ Unique entries to insert: ${uniquePayload.length}`);
    console.log(`  ⚠️ Duplicates detected: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('\n  ⚠️ Skipped duplicate entries:');
      duplicates.forEach((d) =>
        console.log(
          `   - Duplicate formCheckId "${d.formchk_id}" (ID: ${d.formvar_id ?? 'N/A'}, Name: ${d.name ?? ''})`
        )
      );
      console.log();
    }

    // Pass #2 — insert uniques
    // If you prefer extra safety, you can set skipDuplicates: true; but we already pre-filtered.
    const result = await prisma.formField.createMany({
      data: uniquePayload,
      skipDuplicates: false,
    });

    console.log(`  ✅ Seeded ${result.count} form fields`);
  } catch (err) {
    console.error('  ❌ Form field seeding failed:', err);
    throw err;
  }
}
