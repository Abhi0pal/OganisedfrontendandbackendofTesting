import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMasterTableDto, UpdateMasterTableDto } from './dto';

@Injectable()
export class MasterTablesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateMasterTableDto) {
        return this.prisma.master_tables.create({
            data: {
                ...data,
                schema_name: data.schema_name || 'public',
            },
        });
    }

    async findAll(filters?: { is_active?: boolean; search?: string }) {
        const where: any = {};

        if (filters?.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters?.search) {
            where.OR = [
                { master_name: { contains: filters.search, mode: 'insensitive' } },
                { master_code: { contains: filters.search, mode: 'insensitive' } },
                { table_name: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.master_tables.findMany({
            where,
            orderBy: { master_name: 'asc' },
            include: {
                parent_master: {
                    select: {
                        id: true,
                        master_name: true,
                        master_code: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.master_tables.findUnique({
            where: { id },
            include: {
                parent_master: true,
                child_masters: {
                    select: {
                        id: true,
                        master_name: true,
                        master_code: true,
                    },
                },
            },
        });
    }

    async findByCode(code: string) {
        return this.prisma.master_tables.findUnique({
            where: { master_code: code },
            include: {
                parent_master: true,
            },
        });
    }

    async update(id: number, data: UpdateMasterTableDto) {
        return this.prisma.master_tables.update({
            where: { id },
            data,
        });
    }

    async delete(id: number) {
        return this.prisma.master_tables.delete({
            where: { id },
        });
    }

    async toggle(id: number) {
        const masterTable = await this.findOne(id);
        return this.prisma.master_tables.update({
            where: { id },
            data: { is_active: !masterTable?.is_active },
        });
    }

    /**
     * Fetches dropdown options from the actual master table
     * This executes a dynamic query against the configured table
     */
    async getOptions(code: string, parentValue?: string) {
        const masterConfig = await this.findByCode(code);
        if (!masterConfig) {
            throw new Error(`Master table with code ${code} not found`);
        }

        const {
            table_name,
            value_column,
            label_column,
            secondary_label,
            label_template,
            is_active_column,
            is_active_value,
            default_filter,
            default_order_by,
            parent_column,
        } = masterConfig;

        // Build the WHERE clause
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Active filter
        if (is_active_column && is_active_value) {
            // Handle different types of is_active_value
            if (is_active_value.toLowerCase() === 'true') {
                conditions.push(`"${is_active_column}" = true`);
            } else if (is_active_value.toLowerCase() === 'false') {
                conditions.push(`"${is_active_column}" = false`);
            } else {
                conditions.push(`"${is_active_column}" = $${paramIndex}`);
                params.push(is_active_value);
                paramIndex++;
            }
        }

        // Parent filter for cascading dropdowns
        if (parent_column && parentValue) {
            conditions.push(`"${parent_column}" = $${paramIndex}`);
            // Try to parse as number, otherwise use as string
            const parsedValue = !isNaN(Number(parentValue)) ? Number(parentValue) : parentValue;
            params.push(parsedValue);
            paramIndex++;
        }

        // Default filters from JSON config
        if (default_filter && typeof default_filter === 'object') {
            for (const [key, value] of Object.entries(default_filter)) {
                conditions.push(`"${key}" = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        // Build SELECT columns
        let selectColumns = `"${value_column}" as value, "${label_column}" as label`;
        if (secondary_label) {
            selectColumns += `, "${secondary_label}" as secondary_label`;
        }

        // Build query
        let query = `SELECT ${selectColumns} FROM "${table_name}"`;

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Order by
        if (default_order_by) {
            query += ` ORDER BY ${default_order_by}`;
        } else {
            query += ` ORDER BY "${label_column}" ASC`;
        }

        // Execute query
        const results: any[] = await this.prisma.$queryRawUnsafe(query, ...params);

        // Apply label template if configured
        if (label_template && secondary_label) {
            return results.map((row) => ({
                value: row.value,
                label: label_template
                    .replace(`{${label_column}}`, row.label || '')
                    .replace(`{${secondary_label}}`, row.secondary_label || ''),
            }));
        }

        return results.map((row) => ({
            value: row.value,
            label: row.label,
        }));
    }

    /**
     * Get list of available master tables for dropdown in Field Master
     * Returns simplified data for frontend dropdown
     */
    async getForDropdown() {
        return this.prisma.master_tables.findMany({
            where: { is_active: true },
            select: {
                id: true,
                master_name: true,
                master_code: true,
                api_endpoint: true,
                value_column: true,
                label_column: true,
                parent_master_id: true,
                parent_column: true,
            },
            orderBy: { master_name: 'asc' },
        });
    }
}
