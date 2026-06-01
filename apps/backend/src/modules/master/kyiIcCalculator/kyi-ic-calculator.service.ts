import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateKyiIcCalculatorDto, UpdateKyiIcCalculatorDto } from './dto';

@Injectable()
export class KyiIcCalculatorService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateKyiIcCalculatorDto) {
    return this.prisma.kyiIcCalculator.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      // Example: search in description or eligibility_notes
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { eligibility_notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.kyiIcCalculator.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        policy: true,
        msmeYear: true,
        unitCategory: true,
        unitType: true,
        sector: true,
        subSector: true,
        occurrence: true,
        block: true,
        regionCategory: true,
        landCategory: true,
        beneficiaryType: true,
        anchorType: true,
        financialParameter: true,
        incentiveType: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.kyiIcCalculator.findUnique({
      where: { id },
      include: {
        policy: true,
        msmeYear: true,
        unitCategory: true,
        unitType: true,
        sector: true,
        subSector: true,
        occurrence: true,
        block: true,
        regionCategory: true,
        landCategory: true,
        beneficiaryType: true,
        anchorType: true,
        financialParameter: true,
        incentiveType: true,
      },
    });
  }

  async update(id: number, data: UpdateKyiIcCalculatorDto) {
    return this.prisma.kyiIcCalculator.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.kyiIcCalculator.delete({ where: { id } });
  }

  async toggle(id: number) {
    const record = await this.findOne(id);
    if (!record) throw new Error(`KyiIcCalculator with id ${id} not found`);

    return this.prisma.kyiIcCalculator.update({
      where: { id },
      data: { isActive: !record.isActive },
    });
  }
}
