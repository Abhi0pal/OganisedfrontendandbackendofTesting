import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceSectorDto, UpdateServiceSectorDto } from './dto';
@Injectable()
export class ServicesectorService {
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

        return this.prisma.servicesector.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number) {
        return this.prisma.servicesector.findUnique({
            where: { id }, // Remove BigInt() conversion
        });
    }

    async create(CreateServiceSectorDto: CreateServiceSectorDto) {
    
        return this.prisma.servicesector.create({
          data: CreateServiceSectorDto,
        });
      }

    async update(id: number, data: UpdateServiceSectorDto) {
        return this.prisma.servicesector.update({
            where: { id }, // Remove BigInt() conversion
            data,
        });
    }

    async delete(id: number) {
        return this.prisma.servicesector.delete({
            where: { id }, // Remove BigInt() conversion
        });
    }

    async toggle(id: number) {
        const servicesector = await this.findOne(id);
        return this.prisma.servicesector.update({
            where: { id }, // Remove BigInt() conversion
            data: { isActive: !servicesector?.isActive },
        });
    }
}
