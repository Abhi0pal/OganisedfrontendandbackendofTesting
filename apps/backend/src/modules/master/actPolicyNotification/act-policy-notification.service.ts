
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateActPolicyNotificationDto, UpdateActPolicyNotificationDto } from './dto';
import { ActPolicyNotificationTypeLocal } from './dto/create-act-policy-notification.dto';

/**
 * Helper: map local DTO enum → Prisma enum.
 * Values are identical in your schema ("Act" | "Policy" | "Notification"),
 * so this is a safe cast to satisfy TS types at write time.
 */
function toPrismaType(
  t?: ActPolicyNotificationTypeLocal
): ActPolicyNotificationTypeLocal | undefined {
  return t;
}

/** Normalize optional ISO date string → Date | undefined */
function toDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

@Injectable()
export class ActPolicyNotificationService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
    }

    return this.prisma.actPolicyNotification.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        departments: { include: { department: true } },
        amendments: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.actPolicyNotification.findUnique({
      where: { id },
      include: {
        departments: { include: { department: true } },
        amendments: true,
      },
    });
  }

  async create(dto: CreateActPolicyNotificationDto) {
    const { departmentIds, ...actData } = dto;

    return this.prisma.actPolicyNotification.create({
      data: {
        // enum + scalar fields
        type: toPrismaType(actData.type),
        level: actData.level,
        name: actData.name,
        brief: actData.brief,
        englishfilePath: actData.englishfilePath,
        hindifilePath: actData.hindifilePath,
        isActive: actData.isActive ?? true,
        user_agent: actData.user_agent,
        ipaddress: actData.ipaddress,
        start_date: toDate(actData.start_date),
        end_date: toDate(actData.end_date),

        // departments mapping
        departments: departmentIds?.length
          ? {
              create: departmentIds.map((department_id) => ({ department_id })),
            }
          : undefined,
      },
    });
  }

  async update(id: number, dto: UpdateActPolicyNotificationDto) {
    const { departmentIds, ...actData } = dto;

    return this.prisma.actPolicyNotification.update({
      where: { id },
      data: {
        // enum + scalar fields (only set if provided)
        type: actData.type ? toPrismaType(actData.type) : undefined,
        level: actData.level,
        name: actData.name,
        brief: actData.brief,
        englishfilePath: actData.englishfilePath,
        hindifilePath: actData.hindifilePath,
        isActive: actData.isActive,
        user_agent: actData.user_agent,
        ipaddress: actData.ipaddress,
        start_date: actData.start_date ? toDate(actData.start_date) : undefined,
        end_date: actData.end_date ? toDate(actData.end_date) : undefined,

        // re-map departments if departmentIds provided
        ...(departmentIds && {
          departments: {
            deleteMany: {}, // clear previous mappings
            create: departmentIds.map((department_id) => ({ department_id })),
          },
        }),
      },
    });
  }

  async delete(id: number) {
    return this.prisma.actPolicyNotification.delete({
      where: { id },
    });
  }

  async toggle(id: number) {
    const actpolicynotification = await this.findOne(id);
    return this.prisma.actPolicyNotification.update({
      where: { id },
      data: { isActive: !actpolicynotification?.isActive },
    });
  }

  /* ================= AMENDMENTS ================= */

  async getAmendments(actId: number) {
    return this.prisma.actPolicyNotificationAmendment.findMany({
      where: { actpolicynotification_id: actId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAmendment(actId: number, data: any) {
    return this.prisma.actPolicyNotificationAmendment.create({
      data: {
        actpolicynotification_id: actId,
        level: data.level,
        name: data.name,
        brief: data.brief,
        englishfilePath: data.englishfilePath,
        hindifilePath: data.hindifilePath,
        start_date: toDate(data.start_date),
        end_date: toDate(data.end_date),
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateAmendment(amendmentId: number, data: any) {
    return this.prisma.actPolicyNotificationAmendment.update({
      where: { id: amendmentId },
      data: {
        level: data.level,
        name: data.name,
        brief: data.brief,
        englishfilePath: data.englishfilePath,
        hindifilePath: data.hindifilePath,
        start_date: toDate(data.start_date),
        end_date: toDate(data.end_date),
        isActive: data.isActive,
      },
    });
  }
}
