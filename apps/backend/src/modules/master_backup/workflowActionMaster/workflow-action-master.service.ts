import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkflowActionMasterDto, UpdateWorkflowActionMasterDto } from './dto';

@Injectable()
export class WorkflowActionMasterService {
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

    return this.prisma.workflowActionMaster.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.workflowActionMaster.findUnique({ where: { id } });
  }

  async create(data: CreateWorkflowActionMasterDto) {
    return this.prisma.workflowActionMaster.create({ data });
  }

  async update(id: number, data: UpdateWorkflowActionMasterDto) {
    return this.prisma.workflowActionMaster.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.workflowActionMaster.delete({ where: { id } });
  }

  async toggle(id: number) {
    const record = await this.findOne(id);
    return this.prisma.workflowActionMaster.update({
      where: { id },
      data: { isActive: !record?.isActive },
    });
  }
}

