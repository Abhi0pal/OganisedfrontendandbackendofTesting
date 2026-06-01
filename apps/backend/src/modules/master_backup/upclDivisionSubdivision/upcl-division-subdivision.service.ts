import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateUpclDivisionSubdivisionDto,
  UpdateUpclDivisionSubdivisionDto,
} from './dto';

@Injectable()
export class UpclDivisionSubdivisionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUpclDivisionSubdivisionDto) {
    return this.prisma.upclDivisionSubdivision.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      const searchFilter = { contains: filters.search, mode: 'insensitive' };
      where.OR = [
        { divisionId: searchFilter },
        { divisionCode: searchFilter },
        { divisionName: searchFilter },
        { subdivisionId: searchFilter },
        { subdivisionCode: searchFilter },
        { subdivisionName: searchFilter },
      ];
    }

    return this.prisma.upclDivisionSubdivision.findMany({
      where,
      orderBy: [{ divisionName: 'asc' }, { subdivisionName: 'asc' }],
    });
  }

  async findOne(id: number) {
    const subdivision = await this.prisma.upclDivisionSubdivision.findUnique({
      where: { id },
    });

    if (!subdivision) {
      throw new NotFoundException(`UPCL Division Subdivision with ID ${id} not found`);
    }

    return subdivision;
  }

  async update(id: number, data: UpdateUpclDivisionSubdivisionDto) {
    try {
      return await this.prisma.upclDivisionSubdivision.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`UPCL Division Subdivision with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.upclDivisionSubdivision.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`UPCL Division Subdivision with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const subdivision = await this.findOne(id);
    return this.prisma.upclDivisionSubdivision.update({
      where: { id },
      data: { isActive: !subdivision.isActive },
    });
  }
}
