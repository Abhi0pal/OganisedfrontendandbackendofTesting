import { PrismaClient } from '@prisma/client';
import { documentCheckpointsData } from './data/document-checkpoints.data';

export async function seedDocumentCheckpoints(prisma: PrismaClient) {
  try {
    const existingCheckpoints = await prisma.documentCheckpoint.count();

    if (existingCheckpoints > 0) {
      console.log('  ℹ️  Document Checkpoints already exist, skipping...');
      return;
    }

    console.log(`  📊 Seeding ${documentCheckpointsData.length} document checkpoints...`);

    let totalCreated = 0;

    for (const checkpoint of documentCheckpointsData) {
      try {
        // Sanitize dates - skip if '0000-00-00'
        const sanitizedCheckpoint = {
          ...checkpoint,
          created: checkpoint.created?.getFullYear() === 0 ? null : checkpoint.created,
          modified: checkpoint.modified?.getFullYear() === 0 ? null : checkpoint.modified,
        };

        await prisma.documentCheckpoint.create({
          data: sanitizedCheckpoint,
        });
        totalCreated++;
      } catch (error: any) {
        console.warn(
          `  ⚠️  Skipping checkpoint "${checkpoint.name}" - ${error.message}`
        );
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} document checkpoints successfully`);
  } catch (error: any) {
    console.error('  ❌ Document Checkpoint seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}
