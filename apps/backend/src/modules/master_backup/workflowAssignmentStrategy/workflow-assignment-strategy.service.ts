import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateWorkflowAssignmentStrategyDto,
  UpdateWorkflowAssignmentStrategyDto,
} from './dto';

@Injectable()
export class WorkflowAssignmentStrategyService {
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

    return this.prisma.workflowAssignmentStrategyMaster.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.workflowAssignmentStrategyMaster.findUnique({ where: { id } });
  }

  async create(data: CreateWorkflowAssignmentStrategyDto) {
    return this.prisma.workflowAssignmentStrategyMaster.create({ data });
  }

  async update(id: number, data: UpdateWorkflowAssignmentStrategyDto) {
    return this.prisma.workflowAssignmentStrategyMaster.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.workflowAssignmentStrategyMaster.delete({ where: { id } });
  }

  async toggle(id: number) {
    const record = await this.findOne(id);
    return this.prisma.workflowAssignmentStrategyMaster.update({
      where: { id },
      data: { isActive: !record?.isActive },
    });
  }
}

