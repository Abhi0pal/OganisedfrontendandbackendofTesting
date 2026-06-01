import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateHsnCodeDto, UpdateHsnCodeDto } from './dto';

@Injectable()
export class HsnCodeService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateHsnCodeDto) {
    return this.prisma.hsnCode.create({
      data: {
        id: data.id,
        hsnCode: data.hsnCode,
        commodityName: data.commodityName,
        gstRate: data.gstRate,
        isActive: data.isActive ?? 'Y',
      },
    });
  }

  async findAll(filters?: { isActive?: string; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      const normalized = String(filters.isActive).toUpperCase();
      if (normalized === 'TRUE') {
        where.isActive = 'Y';
      } else if (normalized === 'FALSE') {
        where.isActive = 'N';
      } else if (normalized === 'Y' || normalized === 'N') {
        where.isActive = normalized;
      }
    }

    if (filters?.search) {
      where.OR = [
        { commodityName: { contains: filters.search, mode: 'insensitive' } },
        { hsnCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.hsnCode.findMany({
      where,
      orderBy: [{ hsnCode: 'asc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.hsnCode.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateHsnCodeDto) {
    return this.prisma.hsnCode.update({
      where: { id },
      data: {
        hsnCode: data.hsnCode,
        commodityName: data.commodityName,
        gstRate: data.gstRate,
        isActive: data.isActive,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.hsnCode.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const hsnCode = await this.findOne(id);
    const nextValue = hsnCode?.isActive === 'Y' ? 'N' : 'Y';
    return this.prisma.hsnCode.update({
      where: { id },
      data: { isActive: nextValue },
    });
  }
}
