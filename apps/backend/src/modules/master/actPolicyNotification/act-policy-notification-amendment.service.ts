import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateActPolicyNotificationAmendmentDto,
  UpdateActPolicyNotificationAmendmentDto,
} from './dto';

@Injectable()
export class ActPolicyNotificationAmendmentService {
  constructor(private prisma: PrismaService) {}

  // ================= LIST =================
  async findAll(actPolicyNotificationId: number) {
    return this.prisma.actPolicyNotificationAmendment.findMany({
      where: {
        actpolicynotification_id: actPolicyNotificationId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ================= CREATE =================
  async create(
    actPolicyNotificationId: number,
    dto: CreateActPolicyNotificationAmendmentDto,
  ) {
    return this.prisma.actPolicyNotificationAmendment.create({
      data: {
        ...dto,
        actpolicynotification_id: actPolicyNotificationId,
      },
    });
  }

  // ================= UPDATE =================
  async update(
    amendmentId: number,
    dto: UpdateActPolicyNotificationAmendmentDto,
  ) {
    return this.prisma.actPolicyNotificationAmendment.update({
      where: { id: amendmentId },
      data: dto,
    });
  }

  // ================= DELETE =================
  async delete(amendmentId: number) {
    return this.prisma.actPolicyNotificationAmendment.delete({
      where: { id: amendmentId },
    });
  }
}
