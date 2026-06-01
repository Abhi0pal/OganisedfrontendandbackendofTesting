import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateIncentiveApplicationSubmissionDto,
  UpdateIncentiveApplicationSubmissionDto,
} from './dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class IncentiveApplicationSubmissionService {
  constructor(private readonly prisma: PrismaService) {}

async create(dto: CreateIncentiveApplicationSubmissionDto) {
  let cleanedPostData: any = null;

  if (dto.postData) {
    cleanedPostData =
      typeof dto.postData === 'string'
        ? JSON.parse(dto.postData)
        : dto.postData;
  }

  // 1️⃣ Find existing ACTIVE application
  const existing = await this.prisma.incentiveApplicationSubmission.findFirst({
    where: {
      userId: dto.userId,
      incentiveId: dto.incentiveId,
      departmentId: dto.departmentId,
      applicationStatus: {
        in: ['DRAFT', 'SUBMITTED'],
      },
    },
    orderBy: {
      createdOn: 'desc',
    },
  });

  // 2️⃣ If active record exists → UPDATE
  if (existing) {
    return this.prisma.incentiveApplicationSubmission.update({
      where: { id: existing.id },
      data: {
        postData: cleanedPostData,
        installmentNo: dto.installmentNo,
        fy: dto.fy,
        registrationNo: dto.registrationNo,
        applicationStatus: dto.applicationStatus || existing.applicationStatus,
        modifiedOn: new Date(),
      },
    });
  }

  // 3️⃣ Else → CREATE new application
  return this.prisma.incentiveApplicationSubmission.create({
    data: {
      userId: dto.userId,
      incentiveId: dto.incentiveId,
      departmentId: dto.departmentId,

      cafId: dto.cafId,
      parentAppId: dto.parentAppId,
      districtId: dto.districtId,
      sectorId: dto.sectorId,
      unitName: dto.unitName,
      registrationNo: dto.registrationNo,

      postData: cleanedPostData,
      applicationStatus: dto.applicationStatus || 'DRAFT',
      status: dto.status || 'Y',
      installmentNo: dto.installmentNo,
      fy: dto.fy,
    },
  });
}


  async update(id: number, dto: UpdateIncentiveApplicationSubmissionDto) {
    const existing = await this.prisma.incentiveApplicationSubmission.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException(`Submission with ID ${id} not found`);

    return this.prisma.incentiveApplicationSubmission.update({
      where: { id },
      data: {
        ...dto,
        modifiedOn: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.incentiveApplicationSubmission.findMany();
  }


  async findFiltered(filters: {
    incentiveId?: number;
    applicationStatus?: ApplicationStatus;
    userId?: number;
  }) {
    return this.prisma.incentiveApplicationSubmission.findMany({
      where: {
        incentiveId: filters.incentiveId,
        applicationStatus: filters.applicationStatus,
        userId: filters.userId,
      },
      orderBy: {
        createdOn: 'desc',
      },
    });
  }


  async findOne(id: number) {
    const submission = await this.prisma.incentiveApplicationSubmission.findUnique({
      where: { id },
    });
    if (!submission) throw new NotFoundException(`Submission with ID ${id} not found`);
    return submission;
  }

  async remove(id: number) {
    const existing = await this.prisma.incentiveApplicationSubmission.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Submission with ID ${id} not found`);
    return this.prisma.incentiveApplicationSubmission.delete({ where: { id } });
  }
}
