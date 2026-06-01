import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUpclSupplyCategoryDto, UpdateUpclSupplyCategoryDto } from './dto';

@Injectable()
export class UpclSupplyCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUpclSupplyCategoryDto) {
    return this.prisma.upclSupplyCategories.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string; type?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return this.prisma.upclSupplyCategories.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.upclSupplyCategories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`UPCL Supply Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, data: UpdateUpclSupplyCategoryDto) {
    try {
      return await this.prisma.upclSupplyCategories.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`UPCL Supply Category with ID ${id} not found`);
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.upclSupplyCategories.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`UPCL Supply Category with ID ${id} not found`);
    }
  }

  async toggle(id: string) {
    const category = await this.findOne(id);
    return this.prisma.upclSupplyCategories.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }
}
