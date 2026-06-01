import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';

@Injectable()
export class PolicyService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreatePolicyDto) {
        return this.prisma.policy_master.create({
            data: {
                department_id: data.department_id,
                policy_name: data.policy_name,
                policy_code: data.policy_code,
                description: data.description,
                valid_from: new Date(data.valid_from),
                valid_to: new Date(data.valid_to),
                is_active: data.is_active ?? true,
            },
            include: {
                department: true,
            },
        });
    }

    async findAll(filters?: {
        is_active?: boolean;
        search?: string;
        department_id?: number;
    }) {
        const where: any = {};

        if (filters?.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        if (filters?.department_id !== undefined) {
            where.department_id = filters.department_id;
        }

        if (filters?.search) {
            where.OR = [
                { policy_name: { contains: filters.search, mode: 'insensitive' } },
                { policy_code: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.policy_master.findMany({
            where,
            orderBy: { policy_name: 'asc' },
            include: {
                department: true,
            },
        });
    }

    async findOne(id: number) {
        const policy = await this.prisma.policy_master.findUnique({
            where: { id },
            include: {
                department: true,
            },
        });

        if (!policy) {
            throw new NotFoundException('Policy not found');
        }

        return policy;
    }

    async update(id: number, data: UpdatePolicyDto) {
        const updateData: any = { ...data };

        if (data.valid_from) {
            updateData.valid_from = new Date(data.valid_from);
        }

        if (data.valid_to) {
            updateData.valid_to = new Date(data.valid_to);
        }

        updateData.updated_at = new Date();

        return this.prisma.policy_master.update({
            where: { id },
            data: updateData,
            include: {
                department: true,
            },
        });
    }

    async delete(id: number) {
        return this.prisma.policy_master.delete({
            where: { id },
        });
    }

    async toggle(id: number) {
        const policy = await this.findOne(id);

        return this.prisma.policy_master.update({
            where: { id },
            data: {
                is_active: !policy.is_active,
                updated_at: new Date(),
            },
            include: {
                department: true,
            },
        });
    }
}
