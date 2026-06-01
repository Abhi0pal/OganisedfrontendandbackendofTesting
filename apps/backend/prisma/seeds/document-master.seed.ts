import { PrismaClient } from '@prisma/client';
import { documentData } from './data/document-master.data';

async function seedDocumentMaster(prisma: PrismaClient) {
  console.log('📄 Starting DocumentMaster seed...');

  try {
    // Get all valid department IDs from database
    const departments = await prisma.department.findMany({
      select: { id: true },
    });
    const validDepartmentIds = new Set(departments.map((d) => d.id));
    console.log(`  📊 Found ${validDepartmentIds.size} valid departments`);

    // Get all valid state IDs from database
    const states = await prisma.state.findMany({
      select: { id: true },
    });
    const validStateIds = new Set(states.map((s) => s.id));
    console.log(`  📊 Found ${validStateIds.size} valid states`);

    // Get all valid issuer IDs from database
    const issuers = await prisma.issuer.findMany({
      select: { id: true },
    });
    const validIssuerIds = new Set(issuers.map((i) => i.id));
    console.log(`  📊 Found ${validIssuerIds.size} valid issuers`);

    // Get all valid document type IDs from database
    const documentTypes = await prisma.documentType.findMany({
      select: { id: true },
    });
    const validDocumentTypeIds = new Set(documentTypes.map((dt) => dt.id));
    console.log(`  📊 Found ${validDocumentTypeIds.size} valid document types`);

    // Track already seeded IDs to prevent duplicates
    const seededIds = new Set<number>();

    let successCount = 0;
    let errorCount = 0;
    let skipped = 0;
    let duplicateCount = 0;

    for (const document of documentData) {
      try {
        const docId = (document as any).id;

        // SKIP: Duplicate ID check
        if (seededIds.has(docId)) {
          console.warn(`  ⏭️  Skipped ${(document as any).checklistId}: Duplicate ID ${docId}`);
          duplicateCount++;
          continue;
        }

        // CLEAN THE DATA - handle all bad values
        let departmentId = (document as any).departmentId;
        if (typeof departmentId === 'number') {
          departmentId = Math.floor(departmentId);
        } else {
          departmentId = 1;
        }

        // VALIDATE: Check if departmentId exists, otherwise use first available or skip
        if (!validDepartmentIds.has(departmentId)) {
          // Try to find first valid department
          const firstValidDept = Array.from(validDepartmentIds)[0];
          if (firstValidDept) {
            departmentId = firstValidDept;
          } else {
            // No valid departments at all - skip this record
            console.warn(`  ⚠️  Skipped ${(document as any).checklistId}: No valid departments found`);
            skipped++;
            continue;
          }
        }

        let stateId = (document as any).stateId;
        if (typeof stateId === 'number' && !isNaN(stateId)) {
          stateId = Math.floor(stateId);
        } else {
          stateId = 1286; // Default to Uttarakhand
        }

        // VALIDATE: Check if stateId exists
        if (!validStateIds.has(stateId)) {
          const firstValidState = Array.from(validStateIds)[0];
          stateId = firstValidState || 1286;
        }

        let issuerId = (document as any).issuerId;
        if (typeof issuerId === 'number' && !isNaN(issuerId)) {
          issuerId = Math.floor(issuerId);
        } else {
          issuerId = 1;
        }

        // VALIDATE: Check if issuerId exists
        if (!validIssuerIds.has(issuerId)) {
          const firstValidIssuer = Array.from(validIssuerIds)[0];
          issuerId = firstValidIssuer || 1;
        }

        const cleanDocument = {
          id: docId,
          checklistId: (document as any).checklistId || `UK-DCL-${docId}`,
          stateId: stateId,
          issuerId: issuerId,
          departmentId: departmentId,
          documentTypeId: (() => {
            let docTypeId = (document as any).documentTypeId;
            if (typeof docTypeId === 'number' && !isNaN(docTypeId)) {
              docTypeId = Math.floor(docTypeId);
              return validDocumentTypeIds.has(docTypeId) ? docTypeId : null;
            }
            return null;
          })(),
          issuerById: (() => {
            let issuerById = (document as any).issuerById;
            if (typeof issuerById === 'number' && !isNaN(issuerById)) {
              return Math.floor(issuerById);
            }
            return null;
          })(),
          checklistDocumentName: (document as any).checklistDocumentName || 'Document',
          checklistDocumentExtension: (document as any).checklistDocumentExtension || 'PDF',
          checklistDocumentMaxSize: (() => {
            const size = (document as any).checklistDocumentMaxSize;
            if (typeof size === 'number' && !isNaN(size)) {
              return Math.floor(size);
            }
            return 5242880;
          })(),
          prescribedDocumentPath:
            (document as any).prescribedDocumentPath && (document as any).prescribedDocumentPath !== 'null'
              ? String((document as any).prescribedDocumentPath)
              : null,

          // FIX: services - handle missing field
          services: Array.isArray((document as any).services)
            ? ((document as any).services as any[]).filter((s: any) => s !== null && s !== undefined && typeof s === 'number' && !isNaN(s))
            : [],

          // FIX: documentCheckpoints - handle null and non-arrays
          documentCheckpoints: Array.isArray((document as any).documentCheckpoints)
            ? ((document as any).documentCheckpoints as any[]).filter((d: any) => d !== null && d !== undefined && typeof d === 'number' && !isNaN(d))
            : (document as any).documentCheckpoints === null
              ? []
              : [],

          // Boolean conversions - handle string or boolean types
          isMultiVersionAllowed: (document as any).isMultiVersionAllowed === true || (document as any).isMultiVersionAllowed === 'true',
          isDocValidityRequired: (document as any).isDocValidityRequired === true || (document as any).isDocValidityRequired === 'true',
          isDocReferenceNumberRequired:
            (document as any).isDocReferenceNumberRequired === true || (document as any).isDocReferenceNumberRequired === 'true',
          isAutoInsertAllowed: (document as any).isAutoInsertAllowed === true || (document as any).isAutoInsertAllowed === 'true',
          isDocActive: (document as any).isDocActive !== false && (document as any).isDocActive !== 'false',

          // Date parsing
          createdAt: (document as any).createdAt ? new Date((document as any).createdAt) : new Date(),
          updatedAt: (document as any).updatedAt ? new Date((document as any).updatedAt) : new Date(),
        };

        await prisma.documentMaster.create({
          data: cleanDocument,
        });

        // Mark as seeded
        seededIds.add(docId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error seeding ${(document as any).checklistId}: ${(error as Error).message}`);
      }
    }

    console.log(`  ✅ DocumentMaster: ${successCount} records seeded`);
    if (duplicateCount > 0) {
      console.log(`  ⏭️  ${duplicateCount} records skipped (duplicates)`);
    }
    if (errorCount > 0) {
      console.log(`  ⚠️  ${errorCount} records failed`);
    }
    if (skipped > 0) {
      console.log(`  ⏭️  ${skipped} records skipped (invalid FK)`);
    }
  } catch (error) {
    console.error('❌ DocumentMaster seed failed:', error);
    throw error;
  }
}

export { seedDocumentMaster };