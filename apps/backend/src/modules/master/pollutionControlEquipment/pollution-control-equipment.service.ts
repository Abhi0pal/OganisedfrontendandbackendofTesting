import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePollutionControlEquipmentDto, UpdatePollutionControlEquipmentDto } from './dto';

@Injectable()
export class PollutionControlEquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePollutionControlEquipmentDto) {
    return this.prisma.pollutionControlEquipment.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.equipmentName = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.pollutionControlEquipment.findMany({
      where,
      orderBy: { equipmentName: 'asc' },
    });
  }

  async findOne(id: number) {
    const equipment = await this.prisma.pollutionControlEquipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException(`Pollution Control Equipment with ID ${id} not found`);
    }

    return equipment;
  }

  async update(id: number, data: UpdatePollutionControlEquipmentDto) {
    try {
      return await this.prisma.pollutionControlEquipment.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`Pollution Control Equipment with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.pollutionControlEquipment.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Pollution Control Equipment with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const equipment = await this.findOne(id);
    return this.prisma.pollutionControlEquipment.update({
      where: { id },
      data: { isActive: !equipment.isActive },
    });
  }
}
