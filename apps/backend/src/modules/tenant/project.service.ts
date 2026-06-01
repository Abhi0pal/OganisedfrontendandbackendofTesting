import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PrismaClient } from '@prisma/client';
import { generateProjectId } from './id-generator.utility';

// Version-proof types derived from client methods
type TenantProjectCreateData = Parameters<PrismaClient['tenantProject']['create']>[0] extends { data: infer D } ? D : never;
type TenantProjectUpdateData = Parameters<PrismaClient['tenantProject']['update']>[0] extends { data: infer D } ? D : never;

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) { }

  private normalizeProjectName(rawName: string | null | undefined) {
    return String(rawName || '').trim();
  }

  private async ensureUniqueProjectName(
    rawName: string | null | undefined,
    tenantId: number,
    excludeId?: number,
  ) {
    const normalizedName = this.normalizeProjectName(rawName);

    if (!normalizedName) {
      return normalizedName;
    }

    const existing = await this.prisma.tenantProject.findFirst({
      where: {
        tenant_id: tenantId,
        name: { equals: normalizedName, mode: 'insensitive' },
      },
      select: { id: true, name: true },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Project name already exists for this tenant');
    }

    return normalizedName;
  }

  async create(data: TenantProjectCreateData) {
    // Get the max ID to calculate the next ID
    const maxProject = await this.prisma.tenantProject.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const nextId = (maxProject?.id ?? 0) + 1;
    const projectId = generateProjectId(nextId);
    const normalizedName = await this.ensureUniqueProjectName(
      data.name,
      Number(data.tenant_id),
    );

    // Create project with the ID already set
    return this.prisma.tenantProject.create({
      data: {
        ...data,
        name: normalizedName,
        project_ID: projectId,
      },
      include: { tenant: true },
    });
  }

  async findAll(filters?: { tenant_id?: number }) {
    const where: any = {};
    if (filters?.tenant_id !== undefined) {
      where.tenant_id = filters.tenant_id;
    }
    
    try {
      const projects = await this.prisma.tenantProject.findMany({ 
        where, 
        include: { tenant: true },
        orderBy: { id: 'asc' },
      });
      
      // Ensure we always return an array
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      console.error(`[ProjectService] Error querying projects:`, error);
      return [];
    }
  }

  async findOne(id: number) {
    return this.prisma.tenantProject.findUnique({ where: { id }, include: { tenant: true } });
  }

  async update(id: number, data: TenantProjectUpdateData) {
    const existing = await this.prisma.tenantProject.findUnique({
      where: { id },
      select: { tenant_id: true },
    });

    const tenantId = Number(data.tenant_id ?? existing?.tenant_id ?? 0);
    const updateData: TenantProjectUpdateData = { ...data };

    if (tenantId > 0 && typeof data.name === 'string') {
      updateData.name = await this.ensureUniqueProjectName(data.name, tenantId, id);
    }

    return this.prisma.tenantProject.update({
      where: { id },
      data: updateData,
      include: { tenant: true },
    });
  }

  async remove(id: number) {
    return this.prisma.tenantProject.delete({ where: { id } });
  }
}
