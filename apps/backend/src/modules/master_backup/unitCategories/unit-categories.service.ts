import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUnitCategoriesDto, UpdateUnitCategoriesDto } from './dto';

@Injectable()
export class UnitCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUnitCategoriesDto) {
    return this.prisma.unitCategories.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.unitCategories.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { msmeYear: true }, // include related MsmeYear
    });
  }

  async findOne(id: number) {
    return this.prisma.unitCategories.findUnique({
      where: { id },
      include: { msmeYear: true },
    });
  }

  async update(id: number, data: UpdateUnitCategoriesDto) {
    return this.prisma.unitCategories.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.unitCategories.delete({ where: { id } });
  }

  async toggle(id: number) {
    const unitCategory = await this.findOne(id);
    if (!unitCategory) {
      throw new Error(`UnitCategory with id ${id} not found`);
    }
    return this.prisma.unitCategories.update({
      where: { id },
      data: { isActive: !unitCategory.isActive },
    });
  }
}
