import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStateDto, UpdateStateDto } from './dto';

@Injectable()
export class StateService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStateDto) {
    return this.prisma.state.create({
      data,
    });
  }

  async findAll(filters?: { isActive?: boolean; search?: string; countryId?: number }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.countryId) {
      where.countryId = filters.countryId;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.state.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.state.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateStateDto) {
    return this.prisma.state.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.state.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const state = await this.findOne(id);
    return this.prisma.state.update({
      where: { id },
      data: { isActive: !state?.isActive },
    });
  }
}
