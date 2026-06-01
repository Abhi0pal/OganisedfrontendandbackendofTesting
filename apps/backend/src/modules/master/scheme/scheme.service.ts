import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSchemeDto, UpdateSchemeDto } from './dto';

@Injectable()
export class SchemeService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateSchemeDto) {
        return this.prisma.scheme_definitions.create({
            data: {
                policy_id: data.policy_id,
                service_id: data.service_id,
                scheme_name: data.scheme_name,
                scheme_code: data.scheme_code,
                cascading_config: data.cascading_config,
                pop_message_config: data.pop_message_config ?? {},
                form_structure_json: data.form_structure_json ?? {},
                required_documents: data.required_documents ?? [],
                calculation_logic: data.calculation_logic,
                workflow_config: data.workflow_config ?? {},
                admin_view_config: data.admin_view_config ?? {},
                version: data.version ?? 1,
                is_current_version: data.is_current_version ?? true,
                valid_from: new Date(data.valid_from),
                valid_to: new Date(data.valid_to),
            },
            include: {
                policy: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }

    async findAll(filters?: { is_current_version?: boolean; search?: string; policy_id?: number }) {
        const where: any = {};

        if (filters?.is_current_version !== undefined) {
            where.is_current_version = filters.is_current_version;
        }

        if (filters?.policy_id !== undefined) {
            where.policy_id = filters.policy_id;
        }

        if (filters?.search) {
            where.OR = [
                { scheme_name: { contains: filters.search, mode: 'insensitive' } },
                { scheme_code: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.scheme_definitions.findMany({
            where,
            orderBy: { scheme_name: 'asc' },
            include: {
                policy: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.scheme_definitions.findUnique({
            where: { id },
            include: {
                policy: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }

    async update(id: number, data: UpdateSchemeDto) {
        const updateData: any = { ...data };
        if (data.valid_from) {
            updateData.valid_from = new Date(data.valid_from);
        }
        if (data.valid_to) {
            updateData.valid_to = new Date(data.valid_to);
        }

        return this.prisma.scheme_definitions.update({
            where: { id },
            data: updateData,
            include: {
                policy: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }

    async delete(id: number) {
        return this.prisma.scheme_definitions.delete({
            where: { id },
        });
    }

    async toggleVersion(id: number) {
        const scheme = await this.findOne(id);
        return this.prisma.scheme_definitions.update({
            where: { id },
            data: { is_current_version: !scheme?.is_current_version },
            include: {
                policy: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }

    async findByCode(policyCode: string, schemeCode: string, version?: number) {
        // First, find the policy by code
        const policy = await this.prisma.policy_master.findFirst({
            where: { policy_code: policyCode },
        });

        if (!policy) {
            return null;
        }

        const where: any = {
            policy_id: policy.id,
            scheme_code: schemeCode,
        };

        // If version specified, find that version; otherwise find current version
        if (version) {
            where.version = version;
        } else {
            where.is_current_version = true;
        }

        return this.prisma.scheme_definitions.findFirst({
            where,
            include: {
                policy: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }

    async getMasterTables() {
    // 1️⃣ Get all tables starting with m_
    const tables: { tablename: string }[] = await this.prisma.$queryRaw`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'm_%';
    `;

    const result: any[] = [];

    // 2️⃣ For each table, fetch its rows AND columns
    for (const t of tables) {
        const tableName = t.tablename;

        // 2a️⃣ Fetch all rows from this table
        const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM "${tableName}"`
        );

        // 2b️⃣ Fetch columns of this table
        const columns: { column_name: string; data_type: string }[] =
        await this.prisma.$queryRawUnsafe(
            `SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
            ORDER BY ordinal_position`
        );

        // Map columns for frontend dropdown
        const formattedColumns = columns.map((c) => ({
        code: c.column_name,
        label: c.column_name.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
        data_type: c.data_type,
        }));

        result.push({
        master_code: tableName,
        master_name: tableName
            .replace(/^m_/, '')       // remove prefix
            .replace(/_/g, ' ')       // underscores -> spaces
            .replace(/\b\w/g, (c) => c.toUpperCase()), // capitalize
        data: rows,                // all rows from table
        columns: formattedColumns, // column metadata for dropdowns
        });
    }

    return result;
    }

    async findByService(serviceId: string) {
        // 1️⃣ Find scheme by exact service ID (e.g. "946.0")
        const scheme = await this.prisma.scheme_definitions.findFirst({
            where: {
                service_id: serviceId, // exact match
            },
            select: {
                service_id: true,
                form_structure_json: true,
            },
        });

        if (!scheme || !scheme.form_structure_json) {
            return null;
        }

        const formJson = scheme.form_structure_json as any;
        const sections = formJson.sections ?? [];

        /* -------------------------------------------------
        * 2️⃣ Collect unique field codes + label overrides
        * ------------------------------------------------- */
        const fieldCodeMap = new Map<
            string,
            { label_override?: string }
        >();

        for (const section of sections) {
            const fields = section.fields ?? [];

            for (const jsonField of fields) {
                if (!jsonField?.field_code) continue;

                fieldCodeMap.set(jsonField.field_code, {
                    label_override: jsonField.label_override,
                });
            }
        }

        const fieldCodes = Array.from(fieldCodeMap.keys());

        if (!fieldCodes.length) {
            return {
                serviceId: scheme.service_id,
                fields: [],
            };
        }

        /* -------------------------------------------------
        * 3️⃣ Fetch all field_master records in ONE query
        * ------------------------------------------------- */
        const masterFields = await this.prisma.field_master.findMany({
            where: {
                field_code: { in: fieldCodes },
            },
            select: {
                field_code: true,
                field_label: true,
            },
        });

        /* -------------------------------------------------
        * 4️⃣ Build response with label priority
        * label_override > field_master.label
        * ------------------------------------------------- */
        const fields = masterFields.map((mf) => {
            const override =
                fieldCodeMap.get(mf.field_code)?.label_override;

            return {
                value: mf.field_code,
                label: override?.trim() || mf.field_label,
            };
        });

        /* -------------------------------------------------
        * 5️⃣ Final response
        * ------------------------------------------------- */
        return {
            serviceId: scheme.service_id,
            fields,
        };
    }

}
