import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBlockDto, UpdateBlockDto } from './dto';

@Injectable()
export class BlockService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBlockDto) {
    return this.prisma.block.create({
      data,
      include: { district: true, state: true },
    });
  }

  async findAll(filters?: {
    isActive?: boolean;
    search?: string;
    districtId?: number;
    stateId?: number;
  }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.districtId) {
      where.districtId = filters.districtId;
    }

    if (filters?.stateId) {
      where.stateId = filters.stateId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { unitCategory: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.block.findMany({
      where,
      include: { district: true, state: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.block.findUnique({
      where: { id },
      include: { district: true, state: true },
    });
  }

  async update(id: number, data: UpdateBlockDto) {
    return this.prisma.block.update({
      where: { id },
      data,
      include: { district: true, state: true },
    });
  }

  async delete(id: number) {
    return this.prisma.block.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const block = await this.findOne(id);
    return this.prisma.block.update({
      where: { id },
      data: { isActive: !block?.isActive },
      include: { district: true, state: true },
    });
  }

  async findByDistrict(districtId: number) {
    return this.prisma.block.findMany({
      where: { districtId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByState(stateId: number) {
    return this.prisma.block.findMany({
      where: { stateId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
