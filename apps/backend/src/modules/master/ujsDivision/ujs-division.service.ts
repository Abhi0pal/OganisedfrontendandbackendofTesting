import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUjsDivisionDto, UpdateUjsDivisionDto } from './dto';

@Injectable()
export class UjsDivisionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUjsDivisionDto) {
    return this.prisma.ujsDivision.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string; divisionId?: number }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      const searchFilter = { contains: filters.search, mode: 'insensitive' };
      where.OR = [{ officeName: searchFilter }, { address: searchFilter }];
    }

    if (filters?.divisionId !== undefined) {
      where.divisionId = filters.divisionId;
    }

    return this.prisma.ujsDivision.findMany({
      where,
      orderBy: { officeName: 'asc' },
    });
  }

  async findOne(id: number) {
    const division = await this.prisma.ujsDivision.findUnique({ where: { id } });

    if (!division) {
      throw new NotFoundException(`UJS Division with ID ${id} not found`);
    }

    return division;
  }

  async update(id: number, data: UpdateUjsDivisionDto) {
    try {
      return await this.prisma.ujsDivision.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`UJS Division with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.ujsDivision.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`UJS Division with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const division = await this.findOne(id);
    return this.prisma.ujsDivision.update({
      where: { id },
      data: { isActive: !division.isActive },
    });
  }
}
