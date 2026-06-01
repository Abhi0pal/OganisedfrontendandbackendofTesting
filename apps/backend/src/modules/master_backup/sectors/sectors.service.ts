import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSectorsDto, UpdateSectorsDto } from './dto';

@Injectable()
export class SectorsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSectorsDto) {
    return this.prisma.sectors.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.sectors.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { subSectors: true }, // include relation if needed
    });
  }

  async findOne(id: number) {
    return this.prisma.sectors.findUnique({
      where: { id },
      include: { subSectors: true },
    });
  }

  async update(id: number, data: UpdateSectorsDto) {
    return this.prisma.sectors.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.sectors.delete({ where: { id } });
  }

  async toggle(id: number) {
    const sector = await this.findOne(id);
    if (!sector) {
      throw new Error(`Sector with id ${id} not found`);
    }
    return this.prisma.sectors.update({
      where: { id },
      data: { isActive: !sector.isActive },
    });
  }
}
