import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUpclVoltageDto, UpdateUpclVoltageDto } from './dto';

@Injectable()
export class UpclVoltageService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUpclVoltageDto) {
    return this.prisma.upclVoltage.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string; voltageGroup?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      const searchFilter = { contains: filters.search, mode: 'insensitive' };
      where.OR = [{ voltageGroup: searchFilter }, { voltageDesc: searchFilter }];
    }

    if (filters?.voltageGroup) {
      where.voltageGroup = filters.voltageGroup;
    }

    return this.prisma.upclVoltage.findMany({
      where,
      orderBy: [{ voltageGroup: 'asc' }, { voltageDesc: 'asc' }],
    });
  }

  async findOne(id: string) {
    const voltage = await this.prisma.upclVoltage.findUnique({ where: { id } });

    if (!voltage) {
      throw new NotFoundException(`UPCL Voltage with ID ${id} not found`);
    }

    return voltage;
  }

  async update(id: string, data: UpdateUpclVoltageDto) {
    try {
      return await this.prisma.upclVoltage.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`UPCL Voltage with ID ${id} not found`);
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.upclVoltage.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`UPCL Voltage with ID ${id} not found`);
    }
  }

  async toggle(id: string) {
    const voltage = await this.findOne(id);
    return this.prisma.upclVoltage.update({
      where: { id },
      data: { isActive: !voltage.isActive },
    });
  }
}
