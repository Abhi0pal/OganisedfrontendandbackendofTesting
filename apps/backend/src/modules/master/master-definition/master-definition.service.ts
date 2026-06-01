import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMasterDefinitionDto, UpdateMasterDefinitionDto } from './dto/master-definition.dto';

@Injectable()
export class MasterDefinitionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    search?: string,
    isActive?: boolean,
    filters?: { tenantId?: number; projectId?: number; departmentId?: number; subDepartmentId?: number },
  ) {
    const where: any = {};
    if (isActive !== undefined) where.is_active = isActive;
    if (filters?.tenantId) where.tenant_id = filters.tenantId;
    // Include definitions specific to the project OR tenant-wide ones (project_id = null)
    if (filters?.projectId) {
      where.AND = [
        ...(where.AND ?? []),
        { OR: [{ project_id: filters.projectId }, { project_id: null }] },
      ];
    }
    if (search) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const definitions = await this.prisma.masterDefinition.findMany({
      where,
      include: { _count: { select: { data: true } } },
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    });

    if (definitions.length === 0) return [];

    // Collect IDs for batch lookups
    const tenantIds = [...new Set(definitions.map((d) => d.tenant_id).filter(Boolean))] as number[];
    const projectIds = [...new Set(definitions.map((d) => d.project_id).filter(Boolean))] as number[];

    // department_id / sub_department_id now point to master_data records (BigInt stored as string)
    const deptMasterIds = [
      ...new Set(
        definitions
          .map((d) => d.department_id)
          .filter((id): id is number => id != null && !isNaN(Number(id))),
      ),
    ].map(BigInt);

    const subDeptMasterIds = [
      ...new Set(
        definitions
          .map((d) => d.sub_department_id)
          .filter((id): id is number => id != null && !isNaN(Number(id))),
      ),
    ].map(BigInt);

    const [tenants, projects, deptMasterData, subDeptMasterData] = await Promise.all([
      tenantIds.length > 0
        ? this.prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true } })
        : [],
      projectIds.length > 0
        ? this.prisma.tenantProject.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } })
        : [],
      deptMasterIds.length > 0
        ? this.prisma.masterData.findMany({ where: { id: { in: deptMasterIds } }, select: { id: true, data: true } })
        : [],
      subDeptMasterIds.length > 0
        ? this.prisma.masterData.findMany({ where: { id: { in: subDeptMasterIds } }, select: { id: true, data: true } })
        : [],
    ]);

    const tenantMap = new Map<number, string>(tenants.map((t) => [t.id, t.name] as [number, string]));
    const projectMap = new Map<number, string>(projects.map((p) => [p.id, p.name] as [number, string]));
    const deptMap = new Map<string, string>(
      deptMasterData.map((r) => [r.id.toString(), (r.data as any)?.name ?? ''] as [string, string]),
    );
    const subDeptMap = new Map<string, string>(
      subDeptMasterData.map((r) => [r.id.toString(), (r.data as any)?.name ?? ''] as [string, string]),
    );

    return definitions.map((d) => ({
      ...d,
      department_id: d.department_id ? String(d.department_id) : null,
      sub_department_id: d.sub_department_id ? String(d.sub_department_id) : null,
      tenant_name: d.tenant_id ? (tenantMap.get(d.tenant_id) ?? null) : null,
      project_name: d.project_id ? (projectMap.get(d.project_id) ?? null) : null,
      department_name: d.department_id ? (deptMap.get(String(d.department_id)) ?? null) : null,
      sub_department_name: d.sub_department_id ? (subDeptMap.get(String(d.sub_department_id)) ?? null) : null,
    }));
  }

  async findOne(id: number) {
    const row = await this.prisma.masterDefinition.findUnique({
      where: { id },
      include: {
        _count: { select: { data: true } },
        columns: true,
        data: { take: 10 },
      },
    });
    if (!row) throw new NotFoundException(`Master definition #${id} not found`);
    return row;
  }

  async findByCode(code: string) {
    const row = await this.prisma.masterDefinition.findFirst({
      where: { code: code.toUpperCase() },
      include: { _count: { select: { data: true } } },
    });
    if (!row) throw new NotFoundException(`Master "${code}" not found`);
    return row;
  }

  // Generate: M_COUNTRY_001 format
  private toNamePart(name: string): string {
    return name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  private async generateDefinitionCode(name: string): Promise<string> {
    const namePart = this.toNamePart(name);
    // Global sequential — count ALL definitions regardless of name
    const totalCount = await this.prisma.masterDefinition.count();
    const seq = String(totalCount + 1).padStart(3, '0');
    return `M_${namePart}_${seq}`;
  }

  private async checkDuplicate(name: string, tenantId?: number | null, projectId?: number | null, excludeId?: number) {
    const where: any = {
      name: { equals: name.trim(), mode: 'insensitive' },
      tenant_id: tenantId ?? null,
      project_id: projectId ?? null,
    };
    if (excludeId) where.id = { not: excludeId };

    const existing = await this.prisma.masterDefinition.findFirst({ where });
    if (!existing) return;

    const parts: string[] = [];
    if (tenantId) parts.push('this Tenant');
    if (projectId) parts.push('this Project');
    const scope = parts.length > 0 ? ` for ${parts.join(' and ')}` : ' (Global)';
    throw new ConflictException(
      `Master definition "${name}" already exists${scope}. Please use a different name.`,
    );
  }

  async create(dto: CreateMasterDefinitionDto, userId?: bigint) {
    if (!dto?.name) throw new BadRequestException('Name is required');

    await this.checkDuplicate(dto.name, dto.tenantId, dto.projectId);

    const code = await this.generateDefinitionCode(dto.name);

    // Validate parent_master_code exists if provided
    if (dto.parentMasterCode) {
      const parent = await this.prisma.masterDefinition.findFirst({
        where: { code: dto.parentMasterCode.toUpperCase() },
      });
      if (!parent) throw new BadRequestException(`Parent master "${dto.parentMasterCode}" not found`);
    }

    return this.prisma.masterDefinition.create({
      data: {
        name: dto.name,
        code,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        tenant_id: dto.tenantId ?? null,
        project_id: dto.projectId ?? null,
        department_id: dto.departmentId ? Number(dto.departmentId) : null,
        sub_department_id: dto.subDepartmentId ? Number(dto.subDepartmentId) : null,
        is_active: dto.isActive ?? true,
        is_system: false,
        allow_import: true,
        display_order: dto.displayOrder ?? 0,
        parent_master_code: dto.parentMasterCode ? dto.parentMasterCode.toUpperCase() : null,
        created_by: userId ?? BigInt(0),
      },
    });
  }

  async update(id: number, dto: UpdateMasterDefinitionDto, userId?: bigint) {
    const existing = await this.findOne(id);

    if (dto.name !== undefined) {
      const tenantId = dto.tenantId !== undefined ? dto.tenantId : existing.tenant_id;
      const projectId = dto.projectId !== undefined ? dto.projectId : existing.project_id;
      await this.checkDuplicate(dto.name, tenantId, projectId, id);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.displayOrder !== undefined) updateData.display_order = dto.displayOrder;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;
    if (dto.tenantId !== undefined) updateData.tenant_id = dto.tenantId;
    if (dto.projectId !== undefined) updateData.project_id = dto.projectId;
    if (dto.departmentId !== undefined) updateData.department_id = dto.departmentId ? Number(dto.departmentId) : null;
    if (dto.subDepartmentId !== undefined) updateData.sub_department_id = dto.subDepartmentId ? Number(dto.subDepartmentId) : null;
    if (dto.parentMasterCode !== undefined) {
      if (dto.parentMasterCode) {
        const parent = await this.prisma.masterDefinition.findFirst({
          where: { code: dto.parentMasterCode.toUpperCase() },
        });
        if (!parent) throw new BadRequestException(`Parent master "${dto.parentMasterCode}" not found`);
        updateData.parent_master_code = dto.parentMasterCode.toUpperCase();
      } else {
        updateData.parent_master_code = null;
      }
    }

    return this.prisma.masterDefinition.update({
      where: { id },
      data: updateData,
    });
  }

  // Returns full ancestor chain: [Country, State, District] for Block
  async getHierarchyChain(code: string): Promise<{ code: string; name: string }[]> {
    const chain: { code: string; name: string }[] = [];
    let currentCode: string | null = code.toUpperCase();
    const visited = new Set<string>();

    while (currentCode && !visited.has(currentCode)) {
      visited.add(currentCode);
      const def = await this.prisma.masterDefinition.findFirst({
        where: { code: currentCode },
        select: { code: true, name: true, parent_master_code: true },
      });
      if (!def) break;
      chain.unshift({ code: def.code, name: def.name });
      currentCode = def.parent_master_code ?? null;
    }

    return chain;
  }

  async remove(id: number) {
    const row = await this.findOne(id);
    if (row._count?.data > 0) {
      throw new ConflictException(`Cannot delete — ${row._count.data} data records exist. Delete data first.`);
    }
    return this.prisma.masterDefinition.delete({ where: { id } });
  }

  async toggleActive(id: number) {
    const row = await this.findOne(id);
    return this.prisma.masterDefinition.update({
      where: { id },
      data: { is_active: !row.is_active },
    });
  }
}
