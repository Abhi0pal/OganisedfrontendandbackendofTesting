import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFieldDto, UpdateFieldDto } from './dto';

@Injectable()
export class FieldService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateFieldDto) {
        return this.prisma.field_master.create({
            data,
        });
    }

    async findAll(filters?: { is_active?: boolean; search?: string }) {
        const where: any = {};

        if (filters?.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters?.search) {
            where.OR = [
                { field_code: { contains: filters.search, mode: 'insensitive' } },
                { field_label: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.field_master.findMany({
            where,
            orderBy: { field_label: 'asc' },
        });
    }

    async findOne(id: number) {
        return this.prisma.field_master.findUnique({
            where: { id },
        });
    }

    async update(id: number, data: UpdateFieldDto) {
        return this.prisma.field_master.update({
            where: { id },
            data,
        });
    }

    async delete(id: number) {
        return this.prisma.field_master.delete({
            where: { id },
        });
    }

    async toggle(id: number) {
        const field = await this.findOne(id);
        return this.prisma.field_master.update({
            where: { id },
            data: { is_active: !field?.is_active },
        });
    }

    async bulkCreate(fieldsData: CreateFieldDto[]) {
        const results = {
            created: 0,
            skipped: 0,
            errors: [] as string[],
        };

        for (const fieldData of fieldsData) {
            try {
                // Check if field_code already exists
                const existing = await this.prisma.field_master.findUnique({
                    where: { field_code: fieldData.field_code },
                });

                if (existing) {
                    results.skipped++;
                    results.errors.push(`Field "${fieldData.field_code}" already exists`);
                    continue;
                }

                await this.prisma.field_master.create({
                    data: {
                        field_code: fieldData.field_code,
                        field_label: fieldData.field_label,
                        data_type: fieldData.data_type,
                        is_active: fieldData.is_active ?? true,
                    },
                });
                results.created++;
            } catch (error: any) {
                results.errors.push(`Error creating "${fieldData.field_code}": ${error.message}`);
            }
        }

        return results;
    }
}
