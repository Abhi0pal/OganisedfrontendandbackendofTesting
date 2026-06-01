import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { Public } from '../../../common/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@Public()
@Controller('sub-departments')
export class SubDepartmentController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get sub-departments by parent department ID
   * Query param: department_id (required)
   */
  @Get()
  async findByDepartmentId(@Query('department_id') departmentId?: string) {
    if (!departmentId) {
      return {
        error: 'department_id query parameter is required',
      };
    }

    const deptId = parseInt(departmentId, 10);
    
    return this.prisma.subDepartment.findMany({
      where: {
        department_id: deptId,
        isActive: true,
      },
      orderBy: { name_en: 'asc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            tenant_id: true,
          },
        },
      },
    });
  }

  /**
   * Get all active sub-departments
   */
  @Get('all')
  async findAll() {
    return this.prisma.subDepartment.findMany({
      where: {
        isActive: true,
      },
      orderBy: { name_en: 'asc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            tenant_id: true,
          },
        },
      },
    });
  }
}
