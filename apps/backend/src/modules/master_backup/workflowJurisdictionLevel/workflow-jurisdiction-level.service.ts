import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateWorkflowJurisdictionLevelDto,
  UpdateWorkflowJurisdictionLevelDto,
} from './dto';

@Injectable()
export class WorkflowJurisdictionLevelService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.workflowJurisdictionLevelMaster.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.workflowJurisdictionLevelMaster.findUnique({ where: { id } });
  }

  async create(data: CreateWorkflowJurisdictionLevelDto) {
    return this.prisma.workflowJurisdictionLevelMaster.create({ data });
  }

  async update(id: number, data: UpdateWorkflowJurisdictionLevelDto) {
    return this.prisma.workflowJurisdictionLevelMaster.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.workflowJurisdictionLevelMaster.delete({ where: { id } });
  }

  async toggle(id: number) {
    const record = await this.findOne(id);
    return this.prisma.workflowJurisdictionLevelMaster.update({
      where: { id },
      data: { isActive: !record?.isActive },
    });
  }
}

