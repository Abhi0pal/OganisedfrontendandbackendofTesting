import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectStatusDto, UpdateProjectStatusDto } from './dto';

@Injectable()
export class ProjectStatusService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProjectStatusDto) {
    return this.prisma.projectStatus.create({ data });
  }

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.projectStatus.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const status = await this.prisma.projectStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`Project Status with ID ${id} not found`);
    }

    return status;
  }

  async update(id: number, data: UpdateProjectStatusDto) {
    try {
      return await this.prisma.projectStatus.update({ where: { id }, data });
    } catch (error) {
      throw new NotFoundException(`Project Status with ID ${id} not found`);
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.projectStatus.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Project Status with ID ${id} not found`);
    }
  }

  async toggle(id: number) {
    const status = await this.findOne(id);
    return this.prisma.projectStatus.update({
      where: { id },
      data: { isActive: !status.isActive },
    });
  }
}
