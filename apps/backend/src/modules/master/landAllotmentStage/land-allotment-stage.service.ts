import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLandAllotmentStageDto, UpdateLandAllotmentStageDto } from './dto';

@Injectable()
export class LandAllotmentStageService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLandAllotmentStageDto) {
    return this.prisma.landAllotmentStage.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.landAllotmentStage.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const stage = await this.prisma.landAllotmentStage.findUnique({
      where: { id },
    });

    if (!stage) {
      throw new NotFoundException(`Land Allotment Stage with ID ${id} not found`);
    }

    return stage;
  }

  async update(id: number, data: UpdateLandAllotmentStageDto) {
    try {
      return await this.prisma.landAllotmentStage.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`Land Allotment Stage with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.landAllotmentStage.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Land Allotment Stage with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const stage = await this.findOne(id);
    return this.prisma.landAllotmentStage.update({
      where: { id },
      data: { isActive: !stage.isActive },
    });
  }
}
