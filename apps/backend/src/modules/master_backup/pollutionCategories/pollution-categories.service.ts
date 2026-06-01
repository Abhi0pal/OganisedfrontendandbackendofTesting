import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePollutionCategoryDto, UpdatePollutionCategoryDto } from './dto';

@Injectable()
export class PollutionCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePollutionCategoryDto) {
    return this.prisma.pollutionCategory.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.activityName = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.pollutionCategory.findMany({
      where,
      orderBy: { activityName: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.pollutionCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Pollution Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, data: UpdatePollutionCategoryDto) {
    try {
      return await this.prisma.pollutionCategory.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`Pollution Category with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.pollutionCategory.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Pollution Category with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const category = await this.findOne(id);
    return this.prisma.pollutionCategory.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }
}
