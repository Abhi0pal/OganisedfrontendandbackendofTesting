import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDistrictDto, UpdateDistrictDto } from './dto';

@Injectable()
export class DistrictService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDistrictDto) {
    return this.prisma.district.create({
      data,
      include: { state: true },
    });
  }

  async findAll(filters?: {
    isActive?: boolean;
    search?: string;
    stateId?: number;
  }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.stateId) {
      where.stateId = filters.stateId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { abbreviation: { contains: filters.search, mode: 'insensitive' } },
        { districtCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.district.findMany({
      where,
      include: { state: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.district.findUnique({
      where: { id },
      include: { state: true },
    });
  }

  async update(id: number, data: UpdateDistrictDto) {
    return this.prisma.district.update({
      where: { id },
      data,
      include: { state: true },
    });
  }

  async delete(id: number) {
    return this.prisma.district.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const district = await this.findOne(id);
    return this.prisma.district.update({
      where: { id },
      data: { isActive: !district?.isActive },
      include: { state: true },
    });
  }

  async findByState(stateId: number) {
    return this.prisma.district.findMany({
      where: { stateId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
