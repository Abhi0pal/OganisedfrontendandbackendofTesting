import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMsmeYearDto, UpdateMsmeYearDto } from './dto';

@Injectable()
export class MsmeYearService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMsmeYearDto) {
    return this.prisma.msmeYear.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.msmeYear.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { unitCategories: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.msmeYear.findUnique({
      where: { id },
      include: { unitCategories: true },
    });
  }

  async update(id: number, data: UpdateMsmeYearDto) {
    return this.prisma.msmeYear.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.msmeYear.delete({ where: { id } });
  }

  async toggle(id: number) {
    const msmeYear = await this.findOne(id);

    if (!msmeYear) {
      throw new Error(`MsmeYear with id ${id} not found`);
    }

    return this.prisma.msmeYear.update({
      where: { id },
      data: { isActive: !msmeYear.isActive },
    });
  }
}
