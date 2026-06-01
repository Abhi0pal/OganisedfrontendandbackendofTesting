import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateMappingRegionCategoriesDto,
  UpdateMappingRegionCategoriesDto,
} from './dto';

@Injectable()
export class MappingRegionCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMappingRegionCategoriesDto) {
    return this.prisma.mappingRegionCategories.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { block: { name: { contains: filters.search, mode: 'insensitive' } } },
        { regionCategory: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.mappingRegionCategories.findMany({
      where,
      include: { block: true, regionCategory: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.mappingRegionCategories.findUnique({
      where: { id },
      include: { block: true, regionCategory: true },
    });
  }

  async update(id: number, data: UpdateMappingRegionCategoriesDto) {
    return this.prisma.mappingRegionCategories.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.mappingRegionCategories.delete({ where: { id } });
  }

  async toggle(id: number) {
    const mapping = await this.findOne(id);

    if (!mapping) {
      throw new Error(
        `MappingRegionCategories with id ${id} not found`,
      );
    }

    return this.prisma.mappingRegionCategories.update({
      where: { id },
      data: { isActive: !mapping.isActive },
    });
  }
  
  async toggleByCategory(regionCategoryId: number) {
  const mappings = await this.prisma.mappingRegionCategories.findMany({
    where: { regionCategoryId },
  });

  if (!mappings.length) {
    throw new Error("No mappings found");
  }

  const newStatus = !mappings[0].isActive;

  await this.prisma.mappingRegionCategories.updateMany({
    where: { regionCategoryId },
    data: { isActive: newStatus },
  });

  return { success: true };
}

}
