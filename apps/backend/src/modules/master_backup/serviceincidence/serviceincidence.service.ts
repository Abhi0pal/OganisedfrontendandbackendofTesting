import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceIncidenceDto, UpdateServiceIncidenceDto } from './dto';
@Injectable()
export class ServiceincidenceService {
    constructor(private prisma: PrismaService) {}

    async findAll(filters?: { isActive?: boolean; search?: string }) {
        const where: any = {};

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return this.prisma.serviceincidence.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        return this.prisma.serviceincidence.findUnique({
            where: { id }, // Remove BigInt() conversion
        });
    }

    async create(CreateServiceIncidenceDto: CreateServiceIncidenceDto) {
    
        return this.prisma.serviceincidence.create({
          data: CreateServiceIncidenceDto,
        });
      }

    async update(id: number, data: UpdateServiceIncidenceDto) {
        return this.prisma.serviceincidence.update({
            where: { id }, // Remove BigInt() conversion
            data,
        });
    }

    async delete(id: number) {
        return this.prisma.serviceincidence.delete({
            where: { id }, // Remove BigInt() conversion
        });
    }

    async toggle(id: number) {
        const serviceincidence = await this.findOne(id);
        return this.prisma.serviceincidence.update({
            where: { id }, // Remove BigInt() conversion
            data: { isActive: !serviceincidence?.isActive },
        });
    }
}
