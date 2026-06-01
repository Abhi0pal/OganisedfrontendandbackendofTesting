import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUpclSupplySubcategoryDto, UpdateUpclSupplySubcategoryDto } from './dto';

@Injectable()
export class UpclSupplySubcategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUpclSupplySubcategoryDto) {
    return this.prisma.upclSupplySubcategories.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string; type?: string; supplyCategoryId?: string }) {
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

    if (filters?.supplyCategoryId) {
      where.supplyCategoryId = filters.supplyCategoryId;
    }

    return this.prisma.upclSupplySubcategories.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const subcategory = await this.prisma.upclSupplySubcategories.findUnique({
      where: { id },
    });

    if (!subcategory) {
      throw new NotFoundException(`UPCL Supply Subcategory with ID ${id} not found`);
    }

    return subcategory;
  }

  async update(id: string, data: UpdateUpclSupplySubcategoryDto) {
    try {
      return await this.prisma.upclSupplySubcategories.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`UPCL Supply Subcategory with ID ${id} not found`);
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.upclSupplySubcategories.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`UPCL Supply Subcategory with ID ${id} not found`);
    }
  }

  async toggle(id: string) {
    const subcategory = await this.findOne(id);
    return this.prisma.upclSupplySubcategories.update({
      where: { id },
      data: { isActive: !subcategory.isActive },
    });
  }
}
