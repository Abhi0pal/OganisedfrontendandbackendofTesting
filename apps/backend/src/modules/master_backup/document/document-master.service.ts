
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDocumentMasterDto, UpdateDocumentMasterDto } from './dto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class DocumentMasterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get state abbreviation or throw (keeps your current behavior) */
  private async getStateAbbreviation(stateId: number): Promise<string> {
    const state = await this.prisma.state.findUnique({
      where: { id: stateId },
      select: { abbreviation: true },
    });

    if (!state?.abbreviation || !state.abbreviation.trim()) {
      throw new Error(`State with ID ${stateId} not found or missing abbreviation`);
    }

    return state.abbreviation.trim();
  }

  /**
   * Compute next checklist numeric suffix by reading the MAX existing suffix
   * from the DB for the given state (safe against gaps/out-of-order historical data).
   *
   * Uses Postgres SPLIT_PART on the camelCase column "checklistId".
   * Table name is mapped via @@map("m_document_master") in Prisma,
   * so we reference it by "m_document_master".
   */
  private async computeNextSuffix(stateId: number): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ maxNum: number | null }[]>`
      SELECT COALESCE(
        MAX(
          CASE
            WHEN SPLIT_PART("checklistId", '-', 3) ~ '^[0-9]+$'
            THEN CAST(SPLIT_PART("checklistId", '-', 3) AS INTEGER)
            ELSE NULL
          END
        ),
        0
      ) AS "maxNum"
      FROM "m_document_master"
      WHERE "stateId" = ${stateId}
    `;
    const maxNum = rows[0]?.maxNum ?? 0;
    return maxNum + 1;
  }

  /** Format helper: pad to 3 digits */
  private pad3(n: number) {
    return String(n).padStart(3, '0');
  }

  /**
   * Generate checklistId using MAX suffix (not count+1).
   * Kept separate for clarity and reuse from create().
   */
  private async generateChecklistId(stateId: number): Promise<string> {
    const abbr = await this.getStateAbbreviation(stateId);
    const nextSuffix = await this.computeNextSuffix(stateId);
    return `${abbr}-DCL-${this.pad3(nextSuffix)}`;
  }

  findAll() {
    return this.prisma.documentMaster.findMany({
      include: {
        state: true,
        issuer: true,
        department: true,
        documentType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.documentMaster.findUnique({
      where: { id },
      include: {
        state: true,
        issuer: true,
        department: true,
        documentType: true,
      },
    });
  }

  /**
   * Create with MAX+1 generation and retry-on-P2002 to handle concurrency.
   * No schema changes required.
   */
  async create(createDocumentMasterDto: CreateDocumentMasterDto) {
    const { stateId } = createDocumentMasterDto;

    // quick sanity — will throw if state/abbr invalid
    await this.getStateAbbreviation(stateId);

    const MAX_RETRIES = 5;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      attempt += 1;

      const checklistId = await this.generateChecklistId(stateId);

      try {
        const record = await this.prisma.$transaction(async (tx) => {
          return tx.documentMaster.create({
            data: {
              ...createDocumentMasterDto,
              checklistId, // generated server-side
            },
            include: {
              state: true,
              issuer: true,
              department: true,
              documentType: true,
            },
          });
        });

        // success
        return record;

      } catch (err: any) {
        // Unique violation → recompute and retry with tiny backoff
        if (err?.code === 'P2002') {
          await new Promise((r) => setTimeout(r, 20 * attempt)); // 20ms, 40ms, 60ms...
          continue;
        }
        // other errors → rethrow
        throw err;
      }
    }

    // If we got here, we couldn't generate a unique id under high contention
    throw new Error('Failed to generate a unique checklistId after multiple retries');
  }

  // ✅ File deletion on update (unchanged)
  async update(id: number, updateDocumentMasterDto: UpdateDocumentMasterDto) {
    const existingRecord = await this.prisma.documentMaster.findUnique({
      where: { id },
      select: { prescribedDocumentPath: true },
    });

    console.log('🔍 UPDATE DEBUG - Existing path:', existingRecord?.prescribedDocumentPath);
    console.log('🔍 UPDATE DEBUG - New path:', updateDocumentMasterDto.prescribedDocumentPath);

    if (
      updateDocumentMasterDto.prescribedDocumentPath &&
      existingRecord?.prescribedDocumentPath &&
      updateDocumentMasterDto.prescribedDocumentPath !== existingRecord.prescribedDocumentPath
    ) {
      try {
        const oldFilePath = join(process.cwd(), existingRecord.prescribedDocumentPath);
        console.log('🗑️ Attempting to delete old file:', oldFilePath);

        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
          console.log('✅ Old file DELETED successfully:', oldFilePath);
        } else {
          console.log('⚠️ Old file not found:', oldFilePath);
        }
      } catch (error) {
        console.error('❌ Error deleting old file:', error);
      }
    }

    const updatedRecord = await this.prisma.documentMaster.update({
      where: { id },
      data: updateDocumentMasterDto,
      include: {
        state: true,
        issuer: true,
        department: true,
        documentType: true,
      },
    });

    console.log('✅ Document Master UPDATED:', id);
    return updatedRecord;
  }

  async remove(id: number) {
    const record = await this.prisma.documentMaster.findUnique({
      where: { id },
      select: { prescribedDocumentPath: true },
    });

    if (record?.prescribedDocumentPath) {
      try {
        const filePath = join(process.cwd(), record.prescribedDocumentPath);
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log('✅ File DELETED during removal:', filePath);
        }
      } catch (error) {
        console.error('❌ Error deleting file during removal:', error);
      }
    }

    return this.prisma.documentMaster.delete({ where: { id } });
  }

  toggleStatus(id: number) {
    return this.prisma.documentMaster.findUnique({ where: { id } }).then((record) => {
      return this.prisma.documentMaster.update({
        where: { id },
        data: { isDocActive: !record?.isDocActive },
        include: {
          state: true,
          issuer: true,
          department: true,
          documentType: true,
        },
      });
    });
  }
}
