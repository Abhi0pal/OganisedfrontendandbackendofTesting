import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOccurrencesDto, UpdateOccurrencesDto } from './dto';

@Injectable()
export class OccurrencesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateOccurrencesDto) {
    return this.prisma.occurrences.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search)
      where.name = { contains: filters.search, mode: 'insensitive' };

    return this.prisma.occurrences.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.occurrences.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateOccurrencesDto) {
    return this.prisma.occurrences.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.occurrences.delete({ where: { id } });
  }

  async toggle(id: number) {
    const occurrence = await this.findOne(id);
    if (!occurrence) {
      throw new Error(`Occurrences with id ${id} not found`);
    }
    return this.prisma.occurrences.update({
      where: { id },
      data: { isActive: !occurrence.isActive },
    });
  }
}
