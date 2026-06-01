import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNicCodeDto, UpdateNicCodeDto } from './dto';

@Injectable()
export class NicCodeService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateNicCodeDto) {
    return this.prisma.nicCode.create({
      data: {
        id: data.id,
        nicIiDigit: data.nicIiDigit,
        nicIvDigit: data.nicIvDigit,
        nicVDigit: data.nicVDigit,
        description: data.description,
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
        { description: { contains: filters.search, mode: 'insensitive' } },
        { nicVDigit: { contains: filters.search, mode: 'insensitive' } },
        { nicIvDigit: { contains: filters.search, mode: 'insensitive' } },
        { nicIiDigit: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.nicCode.findMany({
      where,
      orderBy: [{ nicVDigit: 'asc' }, { description: 'asc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.nicCode.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateNicCodeDto) {
    return this.prisma.nicCode.update({
      where: { id },
      data: {
        nicIiDigit: data.nicIiDigit,
        nicIvDigit: data.nicIvDigit,
        nicVDigit: data.nicVDigit,
        description: data.description,
        isActive: data.isActive,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.nicCode.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const nicCode = await this.findOne(id);
    const nextValue = nicCode?.isActive === 'Y' ? 'N' : 'Y';
    return this.prisma.nicCode.update({
      where: { id },
      data: { isActive: nextValue },
    });
  }
}
