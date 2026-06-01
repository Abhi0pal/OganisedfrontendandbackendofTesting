import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUnitOrganisationDto, UpdateUnitOrganisationDto } from './dto';

@Injectable()
export class UnitOrganisationService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUnitOrganisationDto) {
    return this.prisma.organisationNature.create({
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

    return this.prisma.organisationNature.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.organisationNature.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(
        `OrganisationNature with id ${id} not found`,
      );
    }

    return record;
  }

  async update(id: number, data: UpdateUnitOrganisationDto) {
    await this.findOne(id); // ensures record exists
    return this.prisma.organisationNature.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.prisma.organisationNature.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const record = await this.findOne(id);

    return this.prisma.organisationNature.update({
      where: { id },
      data: { isActive: !record.isActive },
    });
  }
}
