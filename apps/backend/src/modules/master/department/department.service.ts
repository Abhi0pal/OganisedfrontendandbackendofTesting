import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class DepartmentService {
  private logger = new Logger('DepartmentService');
  constructor(private prisma: PrismaService) { }

  async findAll(filters?: { tenant_id?: number }) {
    const where: any = { isActive: true };
    
    // For dropdown display, return all active departments regardless of tenant filter
    // Departments can be system-level (NULL) or tenant-specific
    if (filters?.tenant_id !== undefined) {
      // Return system-level departments + tenant-specific departments
      where.OR = [
        { tenant_id: null },
        { tenant_id: filters.tenant_id }
      ];
      this.logger.log(`[findAll] Query for tenant_id=${filters.tenant_id}: Fetching system-level + tenant-specific departments`);
    }
    
    const departments = await this.prisma.department.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { issuer: true },
    });
    
    this.logger.log(`[findAll] Found ${departments.length} departments`, {
      filter: filters?.tenant_id,
      departments: departments.map(d => ({ id: d.id, name: d.name, tenant_id: d.tenant_id }))
    });
    
    return departments;
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { issuer: true },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }


  async create(createDepartmentDto: CreateDepartmentDto) {
    // Check if uniqueTag already exists
    const existingDept = await this.prisma.department.findUnique({
      where: { uniqueTag: createDepartmentDto.uniqueTag },
    });

    if (existingDept) {
      throw new ConflictException(
        `Department with unique tag "${createDepartmentDto.uniqueTag}" already exists`
      );
    }

    return this.prisma.department.create({
      data: createDepartmentDto,
    });
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    await this.findOne(id);

    // Check uniqueTag conflict if being updated
    if (updateDepartmentDto.uniqueTag) {
      const existingDept = await this.prisma.department.findUnique({
        where: { uniqueTag: updateDepartmentDto.uniqueTag },
      });

      if (existingDept && existingDept.id !== id) {
        throw new ConflictException(
          `Department with unique tag "${updateDepartmentDto.uniqueTag}" already exists`
        );
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.department.delete({
      where: { id },
    });
  }

  async toggleStatus(id: number) {
    const department = await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data: { isActive: !department.isActive },
    });
  }
}
