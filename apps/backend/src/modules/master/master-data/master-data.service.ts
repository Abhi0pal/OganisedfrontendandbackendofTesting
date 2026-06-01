import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }

    cells.push(current.trim());
    return cells;
  }

  private normalizeLookupKey(value: any) {
    return String(value ?? '').trim().toLowerCase();
  }

  private async syncParentReference(childId: bigint, parentId?: bigint | null) {
    await this.prisma.masterDataReference.deleteMany({
      where: {
        from_data_id: childId,
        column_key: 'parent_id',
      },
    });

    if (!parentId) return;

    await this.prisma.masterDataReference.create({
      data: {
        from_data_id: childId,
        to_data_id: parentId,
        column_key: 'parent_id',
      },
    });
  }

  /**
   * Helper: Transform database response to frontend format
   * Extracts name, abbr from data JSON and returns proper format
   */
  private formatMasterData(record: any) {
    const { id, data, is_active, created_at, updated_at } = record;
    const { name, abbr, ...extraFields } = data || {};

    return {
      id: id.toString(),
      name,
      abbr,
      json_definition: Object.keys(extraFields).length > 0 ? extraFields : null,
      is_active,
      created_at,
      updated_at,
      master_definition_name: record.master?.name ?? null,
      created_by_email: record.createdBy?.email ?? null,
      updated_by_email: record.updatedBy?.email ?? null,
      ...record,
    };
  }

  /**
   * Get master data records by master definition code
   * @param masterCode - The code of the master definition (e.g., 'DEPARTMENT', 'SUB_DEPARTMENT')
   * @param filters - Optional filters
   * @returns Array of master data records
   */
  async findByMasterCode(
    masterCode: string,
    filters?: { is_active?: boolean; tenant_id?: number },
  ) {
    // First, find the master definition by code
    const masterDef = await this.prisma.masterDefinition.findFirst({
      where: {
        code: masterCode,
      },
    });

    if (!masterDef) {
      return [];
    }

    // Build where clause for master data
    const where: any = {
      master_id: masterDef.id,
    };

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters?.tenant_id !== undefined) {
      where.tenant_id = filters.tenant_id;
    } else {
      // If no tenant filter, get system-level master data (tenant_id is null)
      where.tenant_id = null;
    }

    // Fetch master data records
    const masterData = await this.prisma.masterData.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
    });

    // Transform and return
    return masterData.map((record) => this.formatMasterData(record));
  }

  /**
   * Get all master data for a specific master definition ID (with pagination)
   */
  async findByMasterId(
    masterId: number,
    filters?: { is_active?: boolean },
    pagination?: { search?: string; page?: number; limit?: number }
  ) {
    const where: any = {
      master_id: masterId,
    };

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    // Add search filter if provided - search in the JSON data field
    if (pagination?.search) {
      where.data = {
        search: pagination.search,
      };
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.masterData.count({ where });

    // Fetch paginated data
    const dbData = await this.prisma.masterData.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: 'asc',
      },
      include: {
        master: true,
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });

    return {
      total,
      page,
      limit,
      data: dbData.map((record) => this.formatMasterData(record)),
    };
  }

  /**
   * Get a single master data record by ID
   */
  /**
   * Get master data records filtered by parent_id
   * e.g. all Districts where parent_id = <state_id>
   */
  async findByParent(masterCode: string, parentId?: bigint) {
    const masterDef = await this.prisma.masterDefinition.findFirst({
      where: { code: masterCode.toUpperCase() },
    });
    if (!masterDef) return [];

    const records = await this.prisma.masterData.findMany({
      where: { master_id: masterDef.id, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    const formatted = records.map((r) => this.formatMasterData(r));

    // Filter by parent_id if provided
    if (parentId !== undefined) {
      return formatted.filter((r) => {
        const pid = r.json_definition?.parent_id ?? (r as any).data?.parent_id;
        return pid !== undefined && BigInt(pid) === parentId;
      });
    }

    return formatted;
  }

  async findOne(id: bigint) {
    const record = await this.prisma.masterData.findUnique({
      where: {
        id,
      },
      include: {
        master: true,
        referencesFrom: true,
        referencesTo: true,
      },
    });

    return record ? this.formatMasterData(record) : null;
  }

  private async checkDuplicateName(name: string, masterId: number, excludeId?: bigint) {
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT id FROM master_data
      WHERE master_id = ${masterId}
        AND LOWER(data->>'name') = LOWER(${name.trim()})
      LIMIT 1
    `;
    if (rows.length > 0) {
      if (excludeId && BigInt(rows[0].id) === excludeId) return;
      throw new ConflictException(
        `"${name}" already exists in this master definition. Please use a different name.`,
      );
    }
  }

  /**
   * Create new master data record
   * Frontend sends: { name, abbr, master_definition_id, json_definition, tenant_id }
   * Prisma schema requires: { master_id, data (JSON), tenant_id }
   */
  async create(payload: any, userId?: bigint) {
    const name = payload.name;
    const abbr = payload.abbr;
    const masterDefId = payload.masterDefinitionId ?? payload.master_definition_id;
    const jsonDef = payload.jsonDefinition ?? payload.json_definition;
    const tenantId = payload.tenantId ?? payload.tenant_id;
    const isActive = payload.isActive !== undefined ? payload.isActive : (payload.is_active !== undefined ? payload.is_active : true);

    // Validate required fields
    if (!name) {
      throw new Error('name is required');
    }
    if (!masterDefId) {
      throw new Error('master_definition_id is required');
    }

    await this.checkDuplicateName(name, masterDefId);

    // Get the master definition to use its code for the data record
    const masterDef = await this.prisma.masterDefinition.findUnique({
      where: { id: masterDefId },
      select: { code: true },
    });
    if (!masterDef) throw new Error('Master definition not found');

    // Build the data JSON object containing name, abbr, and extra fields
    const dataJson: any = {
      name,
      ...(abbr && { abbr }),
      ...(jsonDef && { ...jsonDef }),
    };

    // Create the master data record
    const created = await this.prisma.masterData.create({
      data: {
        master_id: masterDefId,
        code: masterDef.code,
        data: dataJson,
        tenant_id: tenantId || null,
        is_active: isActive,
        ...(userId && { created_by: userId, updated_by: userId }),
      },
      include: {
        master: true,
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });

    const parentIdRaw = dataJson?.parent_id;
    const parentId = parentIdRaw ? BigInt(String(parentIdRaw)) : null;
    if (parentId) {
      await this.syncParentReference(created.id, parentId);
    }

    return this.formatMasterData(created);
  }

  /**
   * Update master data record
   * Frontend sends: { name, abbr, json_definition, is_active, ... }
   * Transforms to Prisma schema: { data (JSON), is_active, ... }
   */
  async update(id: bigint, payload: any, userId?: bigint) {
    const name = payload.name;
    const abbr = payload.abbr;
    const jsonDef = payload.jsonDefinition ?? payload.json_definition;
    const isActive = payload.isActive !== undefined ? payload.isActive : payload.is_active;
    const masterDefId = payload.masterDefinitionId ?? payload.master_definition_id;

    if (name !== undefined && masterDefId) {
      await this.checkDuplicateName(name, masterDefId, id);
    }

    // Build the data JSON object
    const dataJson: any = {};

    if (name !== undefined) dataJson.name = name;
    if (abbr !== undefined) dataJson.abbr = abbr;
    if (jsonDef !== undefined) {
      Object.assign(dataJson, jsonDef);
    }

    // Prepare update data for Prisma
    const updateData: any = {};

    if (Object.keys(dataJson).length > 0) {
      updateData.data = dataJson;
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    if (userId) {
      updateData.updated_by = userId;
    }

    const updated = await this.prisma.masterData.update({
      where: { id },
      data: updateData,
      include: {
        master: true,
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });

    if (jsonDef !== undefined && 'parent_id' in (jsonDef ?? {})) {
      const parentIdRaw = jsonDef?.parent_id;
      await this.syncParentReference(id, parentIdRaw ? BigInt(String(parentIdRaw)) : null);
    }

    return this.formatMasterData(updated);
  }

  /**
   * Import master data from CSV text
   * Expected CSV columns: name, abbr (optional), then any extra fields
   */
  async importFromCsv(masterId: number, csvText: string, userId?: bigint) {
    const lines = csvText
      .replace(/\r/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

    const masterDef = await this.prisma.masterDefinition.findUnique({
      where: { id: masterId },
      select: { code: true, parent_master_code: true },
    });
    if (!masterDef) throw new Error('Master definition not found');

    let parentLookup: Map<string, bigint> | null = null;
    if (masterDef.parent_master_code) {
      const parentDef = await this.prisma.masterDefinition.findFirst({
        where: { code: masterDef.parent_master_code },
        select: { id: true },
      });
      const parentRows = parentDef
        ? await this.prisma.masterData.findMany({
          where: { master_id: parentDef.id, is_active: true },
          select: { id: true, data: true },
        })
        : [];
      parentLookup = new Map<string, bigint>();
      parentRows.forEach((record) => {
        parentLookup!.set(record.id.toString(), record.id);
        const name = this.normalizeLookupKey((record.data as any)?.name);
        if (name) parentLookup!.set(name, record.id);
        const abbr = this.normalizeLookupKey((record.data as any)?.abbr);
        if (abbr) parentLookup!.set(abbr, record.id);
      });
    }

    // Parse header
    const headers = this.parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]).map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      const name = row['name'];
      if (!name) { results.errors.push(`Row ${i + 1}: name is required`); continue; }

      try {
        // Check duplicate
        const existing: any[] = await this.prisma.$queryRaw`
          SELECT id FROM master_data WHERE master_id = ${masterId} AND LOWER(data->>'name') = LOWER(${name.trim()}) LIMIT 1
        `;
        if (existing.length > 0) { results.skipped++; continue; }

        const dataJson: any = { name };
        if (row['abbr']) dataJson.abbr = row['abbr'];

        let parentId: bigint | null = null;
        if (parentLookup) {
          const parentRaw = row['parent_id'] || row['parent_name'] || row['parent'];
          if (!parentRaw) {
            results.errors.push(`Row ${i + 1}: parent_id or parent_name is required for ${masterDef.code}`);
            continue;
          }
          parentId = parentLookup.get(this.normalizeLookupKey(parentRaw)) ?? null;
          if (!parentId) {
            results.errors.push(`Row ${i + 1}: parent "${parentRaw}" not found`);
            continue;
          }
          dataJson.parent_id = parentId.toString();
        }

        // Extra fields beyond name/abbr
        headers.forEach((h) => {
          if (!row[h]) return;
          if (['name', 'abbr', 'parent', 'parent_name'].includes(h)) return;
          if (h === 'parent_id' && parentLookup) return;
          dataJson[h] = row[h];
        });

        const created = await this.prisma.masterData.create({
          data: {
            master_id: masterId,
            code: masterDef.code,
            data: dataJson,
            tenant_id: null,
            is_active: true,
            ...(userId && { created_by: userId, updated_by: userId }),
          },
        });

        if (parentId) {
          await this.syncParentReference(created.id, parentId);
        }

        results.created++;
      } catch (e: any) {
        results.errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return results;
  }

  /**
   * Toggle active status of master data record
   */
  async toggleActive(id: bigint, userId?: bigint) {
    const record = await this.prisma.masterData.findUnique({ where: { id } });
    if (!record) throw new Error('Record not found');
    const updated = await this.prisma.masterData.update({
      where: { id },
      data: {
        is_active: !record.is_active,
        ...(userId && { updated_by: userId }),
      },
      include: {
        master: true,
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });
    return this.formatMasterData(updated);
  }

  /**
   * Delete master data record
   */
  async delete(id: bigint) {
    return this.prisma.masterData.delete({
      where: { id },
    });
  }

  /**
   * Get master data for dropdown/select options
   * Useful for cascading selects where sub-departments depend on selected department
   */
  async getLinkedData(
    fromDataId: bigint,
    columnKey: string,
    toMasterCode: string,
  ) {
    // Find the target master definition
    const toMasterDef = await this.prisma.masterDefinition.findFirst({
      where: { code: toMasterCode },
    });

    if (!toMasterDef) {
      return [];
    }

    // Get references from the source data to target master data
    const references = await this.prisma.masterDataReference.findMany({
      where: {
        from_data_id: fromDataId,
        column_key: columnKey,
      },
      include: {
        toData: true,
      },
    });

    return references.map((ref) => ref.toData);
  }
}
