import { PrismaClient } from '@prisma/client';
import { dmsDocumentsMappingData } from './data/dms-documents-mapping.data';

export async function seedDmsDocumentsMapping(prisma: PrismaClient) {
  try {
    if (!dmsDocumentsMappingData.length) {
      console.warn('  [WARN] DMS mapping data is empty. Skipping seed.');
      return;
    }

    const result = await prisma.applicationDmsDocumentsMapping.createMany({
      data: dmsDocumentsMappingData,
      skipDuplicates: true,
    });

    const inserted = result.count;
    const skipped = Math.max(dmsDocumentsMappingData.length - inserted, 0);
    console.log(
      `  [OK] DMS document mappings: inserted ${inserted}, skipped ${skipped}`
    );
  } catch (error) {
    console.error('  [ERROR] DMS document mapping seeding failed:', error);
    throw error;
  }
}
