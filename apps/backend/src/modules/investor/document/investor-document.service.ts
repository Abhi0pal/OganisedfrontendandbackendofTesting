import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvestorDocumentDto } from './dto/create-investor-document.dto';
import { UpdateInvestorDocumentDto } from './dto/update-investor-document.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class InvestorDocumentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new investor document
   * Uses dto.documentVersion if provided; otherwise computes next version.
   */
  async create(dto: CreateInvestorDocumentDto, userId: bigint) {
    // Get investor profile UID
    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { id: true, uid: true },
    });

    if (!investorProfile?.uid) {
      throw new BadRequestException(
        'Investor profile not found or missing UID',
      );
    }

    // Get document master to verify and get checklistId
    const documentMaster = await this.prisma.documentMaster.findUnique({
      where: { id: dto.documentMasterId },
      select: {
        id: true,
        checklistId: true,
        isDocValidityRequired: true,
      },
    });

    if (!documentMaster) {
      throw new BadRequestException('Document Master not found');
    }

    // ✅ Integrity check: client-sent checklistId must match master
    if (dto.checklistId !== documentMaster.checklistId) {
      throw new BadRequestException(
        'Invalid checklistId for the selected Document Master',
      );
    }

    // Compute next version only if not provided
    let version = (dto.documentVersion || '').toUpperCase();
    if (!version || !/^V\d+\.\d+$/.test(version)) {
      const existingDocs = await this.prisma.investorDocument.findMany({
        where: {
          documentMasterId: dto.documentMasterId,
          investorProfileUid: investorProfile.uid,
        },
        orderBy: { createdAt: 'desc' },
        select: { documentVersion: true },
      });
      version = this.calculateNextVersion(existingDocs);
    }

    // Generate document reference number
    // Format: {investorProfileUID}_{checklistId}_{version}
    const documentReferenceNumber = `${investorProfile.uid}_${documentMaster.checklistId}_${version}`;

    // Normalize validity fields if master doesn't require them
    const validFrom =
      documentMaster.isDocValidityRequired && dto.validFrom
        ? new Date(dto.validFrom)
        : null;
    const validTo =
      documentMaster.isDocValidityRequired && dto.validTo
        ? new Date(dto.validTo)
        : null;
    const issuance =
      documentMaster.isDocValidityRequired && dto.documentDateOfIssuance
        ? new Date(dto.documentDateOfIssuance)
        : null;

    // Create document
    const createdDocument = await this.prisma.investorDocument.create({
      data: {
        documentMasterId: dto.documentMasterId,
        documentTypeId: dto.documentTypeId,
        issuerId: dto.issuerId,
        departmentId: dto.departmentId,
        investorProfileUid: investorProfile.uid,
        userId: userId,
        documentReferenceNumber,
        documentName: dto.documentName,
        documentVersion: version, // ✅ keep version same as file name
        documentPath: dto.documentPath, // relative path returned by upload
        validFrom,
        validTo,
        documentDateOfIssuance: issuance,
        comments: dto.comments,
        documentStatus: 'U', // default
      },
    });

    return createdDocument;
  }

  async findAll(
    userId: bigint,
    options?: { page?: number; limit?: number },
  ) {
    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { uid: true },
    });

    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    const page =
      Number.isFinite(Number(options?.page)) && Number(options?.page) > 0
        ? Number(options?.page)
        : 1;
    const limit =
      Number.isFinite(Number(options?.limit)) && Number(options?.limit) > 0
        ? Math.min(Number(options?.limit), 100)
        : 10;
    const skip = (page - 1) * limit;

    const where = { investorProfileUid: investorProfile.uid };

    const [total, data] = await Promise.all([
      this.prisma.investorDocument.count({ where }),
      this.prisma.investorDocument.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          documentMasterId: true,
          documentTypeId: true,
          issuerId: true,
          departmentId: true,
          investorProfileUid: true,
          userId: true,
          documentReferenceNumber: true,
          documentName: true,
          documentVersion: true,
          documentStatus: true,
          isDocumentActive: true,
          documentPath: true,
          validFrom: true,
          validTo: true,
          documentDateOfIssuance: true,
          comments: true,
          createdAt: true,
          updatedAt: true,
          documentType: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          issuer: {
            select: {
              id: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: bigint, userId: bigint) {
    const document = await this.prisma.investorDocument.findUnique({
      where: { id },
      include: {
        documentMaster: true,
        documentType: true,
        issuer: true,
        department: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.userId !== userId) {
      throw new BadRequestException('Unauthorized access to document');
    }

    return document;
  }

  async update(id: bigint, dto: UpdateInvestorDocumentDto, userId: bigint) {
    const document = await this.findOne(id, userId);

    if (dto.documentPath && dto.documentPath !== document.documentPath) {
      try {
        const oldFilePath = join(process.cwd(), document.documentPath);
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
      } catch {
        // swallow deletion issues
      }
    }

    const updatedDocument = await this.prisma.investorDocument.update({
      where: { id },
      data: {
        ...(dto.documentName && { documentName: dto.documentName }),
        ...(dto.comments !== undefined && { comments: dto.comments }),
        ...(dto.validFrom && { validFrom: new Date(dto.validFrom) }),
        ...(dto.validTo && { validTo: new Date(dto.validTo) }),
        ...(dto.documentDateOfIssuance && {
          documentDateOfIssuance: new Date(dto.documentDateOfIssuance),
        }),
        ...(dto.documentStatus && { documentStatus: dto.documentStatus }),
        ...(dto.documentPath && { documentPath: dto.documentPath }),
        updatedAt: new Date(),
      },
    });

    return updatedDocument;
  }

  async remove(id: bigint, userId: bigint) {
    const document = await this.findOne(id, userId);

    try {
      const filePath = join(process.cwd(), document.documentPath);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch {
      // swallow deletion issues
    }

    await this.prisma.investorDocument.delete({ where: { id } });

    return { success: true, message: 'Document deleted successfully' };
  }

  async getDocumentStats(userId: bigint) {
    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { uid: true },
    });

    if (!investorProfile?.uid) {
      return { unverified: 0, verified: 0, mismatch: 0, rejected: 0, total: 0 };
    }

    const [unverified, verified, mismatch, rejected, total] = await Promise.all(
      [
        this.prisma.investorDocument.count({
          where: {
            investorProfileUid: investorProfile.uid,
            documentStatus: 'U',
          },
        }),
        this.prisma.investorDocument.count({
          where: {
            investorProfileUid: investorProfile.uid,
            documentStatus: 'V',
          },
        }),
        this.prisma.investorDocument.count({
          where: {
            investorProfileUid: investorProfile.uid,
            documentStatus: 'M',
          },
        }),
        this.prisma.investorDocument.count({
          where: {
            investorProfileUid: investorProfile.uid,
            documentStatus: 'R',
          },
        }),
        this.prisma.investorDocument.count({
          where: { investorProfileUid: investorProfile.uid },
        }),
      ],
    );

    return { unverified, verified, mismatch, rejected, total };
  }

  async getVersionHistory(documentMasterId: number, userId: bigint) {
    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { uid: true },
    });

    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    return this.prisma.investorDocument.findMany({
      where: {
        documentMasterId,
        investorProfileUid: investorProfile.uid,
      },
      include: {
        documentMaster: true,
        documentType: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Calculate next document version
   * V1.0 → V1.1 → ... → V1.10 → V2.0
   */
  private calculateNextVersion(
    existingDocs: { documentVersion: string }[],
  ): string {
    if (!existingDocs.length) return 'V1.0';
    const latestVersion = (
      existingDocs[0].documentVersion || 'V1.0'
    ).toUpperCase(); // e.g., "V1.7"
    const [major, minor] = latestVersion.substring(1).split('.').map(Number);
    if (Number.isNaN(major) || Number.isNaN(minor)) return 'V1.0';
    return minor < 10 ? `V${major}.${minor + 1}` : `V${major + 1}.0`;
  }
}
