import { PrismaClient } from '@prisma/client';
import { documentTypesData } from './data/document-types.data';

export async function seedDocumentTypes(prisma: PrismaClient) {
  try {
    const existingDocumentTypes = await prisma.documentType.count();

    if (existingDocumentTypes > 0) {
      console.log('  ℹ️  Document Types already exist, skipping...');
      return;
    }

    console.log(`  📊 Seeding ${documentTypesData.length} document types...`);

    let totalCreated = 0;

    for (const documentType of documentTypesData) {
      try {
        await prisma.documentType.create({
          data: documentType,
        });
        totalCreated++;
      } catch (error: any) {
        console.warn(
          `  ⚠️  Skipping document type "${documentType.name}" - ${error.message}`
        );
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} document types successfully`);
  } catch (error: any) {
    console.error('  ❌ Document Type seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}
