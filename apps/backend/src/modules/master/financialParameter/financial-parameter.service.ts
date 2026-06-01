import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateFinancialParameterDto,
  UpdateFinancialParameterDto,
} from './dto';

@Injectable()
export class FinancialParameterService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFinancialParameterDto) {
    return this.prisma.financialParameter.create({
      data,
    });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];

    return this.prisma.financialParameter.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.financialParameter.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateFinancialParameterDto) {
    return this.prisma.financialParameter.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.financialParameter.delete({ where: { id } });
  }

  async toggle(id: number) {
    const param = await this.findOne(id);

    if (!param) {
      throw new Error(`FinancialParameter with id ${id} not found`);
    }

    return this.prisma.financialParameter.update({
      where: { id },
      data: { isActive: !param.isActive },
    });
  }
}
