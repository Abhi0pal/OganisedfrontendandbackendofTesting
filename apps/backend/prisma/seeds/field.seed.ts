import { PrismaClient } from '@prisma/client';
import { fieldData } from './data/field.data';

export async function seedFields(prisma: PrismaClient) {
    try {
        // Check if fields already exist
        const existingFields = await prisma.field_master.count();

        if (existingFields > 0) {
            console.log('  ℹ️  Field master already seeded, skipping...');
            return;
        }

        console.log(`  📊 Seeding ${fieldData.length} fields into field_master...`);

        let totalCreated = 0;

        for (const field of fieldData) {
            try {
                await prisma.field_master.create({
                    data: {
                        field_code: field.field_code,
                        field_label: field.field_label,
                        data_type: field.data_type,
                        is_active: field.is_active,
                    },
                });

                totalCreated++;
            } catch (error: any) {
                console.warn(
                    `  ⚠️  Skipping field "${field.field_code}" - ${error.message}`
                );
            }
        }

        console.log(`  ✅ Seeded ${totalCreated} fields successfully`);
    } catch (error: any) {
        console.error('  ❌ Field master seeding failed:', error.message);
        if (error.meta) {
            console.error('  📍 Meta info:', error.meta);
        }
        throw error;
    }
}
