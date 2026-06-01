import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateIncentiveApplicationFlowlogDto,
  UpdateIncentiveApplicationFlowlogDto,
} from './dto';

@Injectable()
export class IncentiveApplicationFlowlogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIncentiveApplicationFlowlogDto) {
    return this.prisma.incentiveApplicationFlowlog.create({
      data: {
        applicationId: dto.applicationId,
        currentRoleId: dto.currentRoleId,
        nextRoleId: dto.nextRoleId,
        userId: dto.userId,
        approvedAmountByDepartment: dto.approvedAmountByDepartment,
        disbursedAmountByDepartment: dto.disbursedAmountByDepartment,
        remarks: dto.remarks,
        delayRemarks: dto.delayRemarks,
        additionalPostData: dto.additionalPostData,
        approvalStatus: dto.approvalStatus,
        actionStatus: dto.actionStatus,
        userAgent: dto.userAgent,
        remoteIpAddress: dto.remoteIpAddress,
        status: dto.status || 'Y', // default
        createdDate: new Date(), // ✅ capture server hit time here
        file: dto.file,
        uploadedFileName: dto.uploadedFileName,
        approvedIncentive: dto.approvedIncentive,
        recommendation: dto.recommendation,
      },
    });
  }

  async update(id: number, dto: UpdateIncentiveApplicationFlowlogDto) {
    const existing = await this.prisma.incentiveApplicationFlowlog.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException(`Flowlog with ID ${id} not found`);

    return this.prisma.incentiveApplicationFlowlog.update({
      where: { id },
      data: {
        ...dto,
        modifiedOn: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.incentiveApplicationFlowlog.findMany();
  }

  async findOne(id: number) {
    const flowlog = await this.prisma.incentiveApplicationFlowlog.findUnique({ where: { id } });
    if (!flowlog) throw new NotFoundException(`Flowlog with ID ${id} not found`);
    return flowlog;
  }

  async remove(id: number) {
    const existing = await this.prisma.incentiveApplicationFlowlog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Flowlog with ID ${id} not found`);
    return this.prisma.incentiveApplicationFlowlog.delete({ where: { id } });
  }
}
