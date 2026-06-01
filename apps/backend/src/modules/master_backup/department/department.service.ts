import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { order: 'asc' },
      include: { issuer: true },
    });
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
