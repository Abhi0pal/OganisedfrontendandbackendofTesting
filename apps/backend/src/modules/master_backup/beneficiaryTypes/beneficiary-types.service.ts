import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBeneficiaryTypesDto, UpdateBeneficiaryTypesDto } from './dto';

@Injectable()
export class BeneficiaryTypesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBeneficiaryTypesDto) {
    return this.prisma.beneficiaryTypes.create({
      data,
    });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.beneficiaryTypes.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.beneficiaryTypes.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateBeneficiaryTypesDto) {
    return this.prisma.beneficiaryTypes.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.beneficiaryTypes.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const beneficiaryType = await this.findOne(id);
    return this.prisma.beneficiaryTypes.update({
      where: { id },
      data: { isActive: !beneficiaryType?.isActive },
    });
  }
}
