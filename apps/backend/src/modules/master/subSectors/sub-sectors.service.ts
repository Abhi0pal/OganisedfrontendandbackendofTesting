import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSubSectorsDto, UpdateSubSectorsDto } from './dto';

@Injectable()
export class SubSectorsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSubSectorsDto) {
    return this.prisma.subSectors.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.subSectors.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { sector: true }, // Include parent sector
    });
  }

  async findOne(id: number) {
    return this.prisma.subSectors.findUnique({
      where: { id },
      include: { sector: true },
    });
  }

  async update(id: number, data: UpdateSubSectorsDto) {
    return this.prisma.subSectors.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.subSectors.delete({ where: { id } });
  }

  async toggle(id: number) {
    const subSector = await this.findOne(id);
    if (!subSector) {
      throw new Error(`SubSector with id ${id} not found`);
    }
    return this.prisma.subSectors.update({
      where: { id },
      data: { isActive: !subSector.isActive },
    });
  }
  
}
