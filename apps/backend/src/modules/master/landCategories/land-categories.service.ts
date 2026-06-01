import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLandCategoriesDto, UpdateLandCategoriesDto } from './dto';

@Injectable()
export class LandCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLandCategoriesDto) {
    return this.prisma.landCategories.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.landCategories.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.landCategories.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateLandCategoriesDto) {
    return this.prisma.landCategories.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.landCategories.delete({ where: { id } });
  }

  async toggle(id: number) {
    const category = await this.findOne(id);

    if (!category) {
      throw new Error(`LandCategories with id ${id} not found`);
    }

    return this.prisma.landCategories.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }
}
