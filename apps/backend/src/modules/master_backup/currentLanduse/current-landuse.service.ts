import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCurrentLanduseDto, UpdateCurrentLanduseDto } from './dto';

@Injectable()
export class CurrentLanduseService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCurrentLanduseDto) {
    return this.prisma.currentLanduse.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.currentLanduse.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const landuse = await this.prisma.currentLanduse.findUnique({
      where: { id },
    });

    if (!landuse) {
      throw new NotFoundException(`Current Landuse with ID ${id} not found`);
    }

    return landuse;
  }

  async update(id: number, data: UpdateCurrentLanduseDto) {
    try {
      return await this.prisma.currentLanduse.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`Current Landuse with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.currentLanduse.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Current Landuse with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const landuse = await this.findOne(id);
    return this.prisma.currentLanduse.update({
      where: { id },
      data: { isActive: !landuse.isActive },
    });
  }
}
