
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { MasterData, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private generateIuid(): string {
    const n = Math.floor(10_000_000 + Math.random() * 89_999_999);
    return String(n);
  }

  // ---------------- CREATE ----------------
  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.users.findFirst({
          where: { email: dto.email },
        });

        if (existing) {
          throw new ConflictException('Email already exists');
        }

        // ---------------- VALIDATE PROJECT ----------------
        if (dto.project_id) {
          const project = await tx.tenantProject.findUnique({
            where: { id: dto.project_id },
          });

          if (!project) {
            throw new BadRequestException('Invalid project');
          }

          if (
            dto.tenant_id !== null &&
            dto.tenant_id !== undefined &&
            project.tenant_id !== dto.tenant_id
          ) {
            throw new BadRequestException(
              'Project does not belong to tenant',
            );
          }
        }

        // ---------------- VALIDATE ROLE ----------------
        if (dto.role_id) {
          const role = await tx.roles.findUnique({
            where: { id: dto.role_id },
          });

          if (!role) {
            throw new BadRequestException('Invalid role');
          }
        }

        // ---------------- VALIDATE DEPARTMENT ----------------
        let department : MasterData| null = null;
        if (dto.department_id) {
          department = await tx.masterData.findUnique({
            where: { id: BigInt(dto.department_id) },
          });


          if (!department || department.master_id !== 1) {
            throw new BadRequestException('Invalid department');
          }
        }

        // ---------------- VALIDATE SUB-DEPARTMENT ----------------
        let subDepartment : MasterData | null = null;
        if (dto.sub_department_id) {
          subDepartment = await tx.masterData.findUnique({
            where: { id: BigInt(dto.sub_department_id) },
          });

          if (!subDepartment || subDepartment.master_id !== 3) {
            throw new BadRequestException('Invalid sub-department');
          }

         if(subDepartment){
          const subDeptData = subDepartment.data as{
            department_id ?: number;
          };

          if(subDeptData.department_id !== dto.department_id){
            throw new BadRequestException('Sub-department does not belong to department');
          }
         }

            
        }

        // ---------------- HASH PASSWORD ----------------
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(dto.password, salt);

       const user = await tx.users.create({
      data: {
        email: dto.email,
        password_hash,
        salt,
        user_type: dto.user_type,
        role_id: dto.role_id,
        tenant_id: dto.tenant_id,
        project_id: dto.project_id,
        department_id: dto.department_id
          ? BigInt(dto.department_id)
          : null,
        sub_department_id: dto.sub_department_id
          ? BigInt(dto.sub_department_id)
          : null,
        is_active: dto.is_active ?? true,
        is_email_verified: dto.is_email_verified ?? 0,
      },
    });

    // ================= INVESTOR =================
    if (dto.user_type === 'INVESTOR') {
      await tx.investor_profiles.create({
        data: {
          user_id: user.id,
          uid: this.generateIuid(),

          first_name: dto.first_name!,
          last_name: dto.last_name ?? '',

          country_name: dto.country_name ?? 'India',
          state_name: dto.state_name ?? 'NA',
          city_name: dto.city_name ?? 'NA',
          district_name: dto.district_name ?? 'NA',
          pin_code: dto.pin_code ?? '000000',
          address: dto.address ?? 'NA',
          pan_card: dto.pan_card ?? null,
          adhaar_number: dto.adhaar_number ?? null,

          mobile_number: dto.mobile_number
            ? BigInt(dto.mobile_number)
            : BigInt('9999999999'),
        },
      });
    }

    // ================= DEPARTMENT =================
    else {
      await tx.department_users.create({
        data: {
          user_id: user.id,

          full_name: dto.full_name!,
          hindi_full_name: dto.hindi_full_name ?? null,
          email: user.email,

          office_no: dto.office_no ?? null,
          mobile: dto.mobile ?? null,

          dept_id: dto.dept_id ?? 1,
          district_id: dto.district_id ?? null,
          tahsil_id: dto.tehsil_id ?? 0,
          circle_id: dto.circle_id ?? null,
          block_id: dto.block_id ?? 0,
          office_id: dto.office_id ?? 0,
          division_id: dto.division_id ?? 0,

          status: 1,
        },
      });
    }

    return user;
  });
    } catch (error) {
      this.handleError(error);
    }
  }

  // ---------------- GET ALL ----------------
  async findAll(query?: any) {
    try {
      const where: any = {};
      if (query?.tenant_id) {
        where.tenant_id = Number(query.tenant_id);
      }
      if (query?.user_type) {
        where.user_type = query.user_type;
      }

      return await this.prisma.users.findMany({
        where,
        include: {
          role: true,
          tenant: true,
          project: true,
          department: true,       
          subDepartment: true,  
          investor_profile:true,
          department_user:true,  
        },
        orderBy: { created_at: 'desc' },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  // ---------------- GET ONE ----------------
  async findOne(id: number) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
        include: {
          role: true,
          tenant: true,
          project: true,
          department: true,
          subDepartment: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  // ---------------- UPDATE ----------------
  async update(id: number, dto: UpdateUserDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.users.findUnique({
          where: { id },
          include: {
            investor_profile: true,
            department_user: true,
          },
        });

        if (!existing) {
          throw new NotFoundException('User not found');
        }

        let password_hash = existing.password_hash;
        let salt = existing.salt;

        if (dto.password) {
          salt = await bcrypt.genSalt(10);
          password_hash = await bcrypt.hash(dto.password, salt);
        }

         const updatedUser = await tx.users.update({
      where: { id },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.user_type && { user_type: dto.user_type }),
        ...(dto.role_id !== undefined && { role_id: dto.role_id }),
        ...(dto.tenant_id !== undefined && { tenant_id: dto.tenant_id }),
        ...(dto.project_id !== undefined && { project_id: dto.project_id }),

        ...(dto.department_id !== undefined && {
          department_id: dto.department_id
            ? BigInt(dto.department_id)
            : null,
        }),
        ...(dto.sub_department_id !== undefined && {
          sub_department_id: dto.sub_department_id
            ? BigInt(dto.sub_department_id)
            : null,
        }),

        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.is_email_verified !== undefined && {
          is_email_verified: dto.is_email_verified,
        }),

        password_hash,
        salt,
      },
    });

    // ================= INVESTOR =================
    if (existing.user_type === 'INVESTOR' && existing.investor_profile) {
      await tx.investor_profiles.update({
        where: { user_id: existing.id },
        data: {
          ...(dto.first_name && { first_name: dto.first_name }),
          ...(dto.last_name && { last_name: dto.last_name }),
          ...(dto.country_name && { country_name: dto.country_name }),
          ...(dto.state_name && { state_name: dto.state_name }),
          ...(dto.city_name && { city_name: dto.city_name }),
          ...(dto.district_name && { district_name: dto.district_name }),
          ...(dto.pin_code && { pin_code: dto.pin_code }),
          ...(dto.address && { address: dto.address }),
          ...(dto.pan_card && { pan_card: dto.pan_card }),
          ...(dto.adhaar_number && { adhaar_number: dto.adhaar_number }),
          ...(dto.mobile_number && {
            mobile_number: BigInt(dto.mobile_number),
          }),
        },
      });
    }

    // ================= DEPARTMENT =================
    else {
      await tx.department_users.update({
        where: { user_id: existing.id },
        data: {
          ...(dto.full_name && { full_name: dto.full_name }),
          ...(dto.hindi_full_name && { hindi_full_name: dto.hindi_full_name }),
          ...(dto.office_no && { office_no: dto.office_no }),
          ...(dto.mobile && { mobile: dto.mobile }),
          ...(dto.dept_id && { dept_id: dto.dept_id }),
          ...(dto.district_id && { district_id: dto.district_id }),
          ...(dto.tehsil_id && { tahsil_id: dto.tehsil_id }),
          ...(dto.circle_id && { circle_id: dto.circle_id }),
          ...(dto.block_id && { block_id: dto.block_id }),
          ...(dto.office_id && { office_id: dto.office_id }),
          ...(dto.division_id && { division_id: dto.division_id }),
        },
      });
    }

    return updatedUser;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // ---------------- DELETE ----------------
  async remove(id: number) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.prisma.users.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // ---------------- ERROR HANDLER ----------------
  private handleError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Duplicate record');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Record not found');
      }
      throw new BadRequestException(error.message);
    }

    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    throw new InternalServerErrorException('Something went wrong');
  }
}

