import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateIncentiveTypesDto, UpdateIncentiveTypesDto } from './dto';

@Injectable()
export class IncentiveTypesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateIncentiveTypesDto) {
    return this.prisma.incentiveTypes.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.incentiveTypes.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.incentiveTypes.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateIncentiveTypesDto) {
    return this.prisma.incentiveTypes.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.incentiveTypes.delete({ where: { id } });
  }

  async toggle(id: number) {
    const type = await this.findOne(id);

    if (!type) {
      throw new Error(`IncentiveTypes with id ${id} not found`);
    }

    return this.prisma.incentiveTypes.update({
      where: { id },
      data: { isActive: !type.isActive },
    });
  }
}
