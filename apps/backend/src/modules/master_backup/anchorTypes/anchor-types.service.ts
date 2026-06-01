import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAnchorTypesDto, UpdateAnchorTypesDto } from './dto';

@Injectable()
export class AnchorTypesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAnchorTypesDto) {
    return this.prisma.anchorTypes.create({
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

    return this.prisma.anchorTypes.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.anchorTypes.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateAnchorTypesDto) {
    return this.prisma.anchorTypes.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.anchorTypes.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const anchorType = await this.findOne(id);
    return this.prisma.anchorTypes.update({
      where: { id },
      data: { isActive: !anchorType?.isActive },
    });
  }
}
