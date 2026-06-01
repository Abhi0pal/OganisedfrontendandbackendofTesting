import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCountryDto, UpdateCountryDto } from './dto';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCountryDto) {
    return this.prisma.country.create({
      data,
    });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { abbreviation: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.country.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.country.findUnique({
      where: { id }, // Remove BigInt() conversion
    });
  }

  async update(id: number, data: UpdateCountryDto) {
    return this.prisma.country.update({
      where: { id }, // Remove BigInt() conversion
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.country.delete({
      where: { id }, // Remove BigInt() conversion
    });
  }

  async toggle(id: number) {
    const country = await this.findOne(id);
    return this.prisma.country.update({
      where: { id }, // Remove BigInt() conversion
      data: { isActive: !country?.isActive },
    });
  }
}