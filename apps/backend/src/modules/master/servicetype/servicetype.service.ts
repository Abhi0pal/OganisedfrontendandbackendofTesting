import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServicetypeDto, UpdateServiceTypeDto } from './dto';
@Injectable()
export class ServicetypeService {
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

        return this.prisma.servicetype.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        return this.prisma.servicetype.findUnique({
            where: { id }, // Remove BigInt() conversion
        });
    }

    async create(CreateServicetypeDto: CreateServicetypeDto) {
    
        return this.prisma.servicetype.create({
          data: CreateServicetypeDto,
        });
      }

    async update(id: number, data: UpdateServiceTypeDto) {
        return this.prisma.servicetype.update({
            where: { id }, // Remove BigInt() conversion
            data,
        });
    }

    async delete(id: number) {
        return this.prisma.servicetype.delete({
            where: { id }, // Remove BigInt() conversion
        });
    }

    async toggle(id: number) {
        const servicetype = await this.findOne(id);
        return this.prisma.servicetype.update({
            where: { id }, // Remove BigInt() conversion
            data: { isActive: !servicetype?.isActive },
        });
    }
}
