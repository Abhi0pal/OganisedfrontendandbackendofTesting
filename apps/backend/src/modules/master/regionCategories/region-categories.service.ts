import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRegionCategoriesDto, UpdateRegionCategoriesDto } from './dto';

@Injectable()
export class RegionCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRegionCategoriesDto) {
    return this.prisma.regionCategories.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.regionCategories.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.regionCategories.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateRegionCategoriesDto) {
    return this.prisma.regionCategories.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.regionCategories.delete({ where: { id } });
  }

  async toggle(id: number) {
    const category = await this.findOne(id);
    return this.prisma.regionCategories.update({
      where: { id },
      data: { isActive: !category?.isActive },
    });
  }
}
