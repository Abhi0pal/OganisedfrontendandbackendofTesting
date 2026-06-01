
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFormTypeDto, UpdateFormTypeDto } from './dto';

@Injectable()
export class FormTypeService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { abbr: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.formType.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const entity = await this.prisma.formType.findUnique({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Form Type with ID ${id} not found`);
    }
    return entity;
  }

  async create(data: CreateFormTypeDto) {
    // abbr is unique in your schema; findUnique on abbr is valid
    const existingByAbbr = await this.prisma.formType.findUnique({
      where: { abbr: data.abbr },
    });

    if (existingByAbbr) {
      throw new ConflictException(`Form Type with abbreviation "${data.abbr}" already exists`);
    }

    const existingByName = await this.prisma.formType.findFirst({
      where: { name: data.name },
    });
    if (existingByName) {
      throw new ConflictException(`Form Type with name "${data.name}" already exists`);
    }

    return this.prisma.formType.create({ data });
  }

  async update(id: number, data: UpdateFormTypeDto) {
    await this.findOne(id);

    if (data.abbr) {
      const existing = await this.prisma.formType.findUnique({
        where: { abbr: data.abbr },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Form Type with abbreviation "${data.abbr}" already exists`);
      }
    }

    if (data.name) {
      const existingByName = await this.prisma.formType.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existingByName) {
        throw new ConflictException(`Form Type with name "${data.name}" already exists`);
      }
    }

    return this.prisma.formType.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.prisma.formType.delete({ where: { id } });
  }

  async toggle(id: number) {
    const formtype = await this.findOne(id);
    return this.prisma.formType.update({
      where: { id },
      data: { isActive: !formtype.isActive },
    });
  }
}
