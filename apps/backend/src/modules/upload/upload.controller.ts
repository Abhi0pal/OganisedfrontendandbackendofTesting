import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname, dirname } from 'path';
import { existsSync, mkdirSync, renameSync } from 'fs';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Resource } from '../../common/resource.decorator';
import { SkipResourceCheck } from '../../common/skip-resource-check.decorator';
import { PrismaService } from '../database/prisma.service';
import { InvestorDocumentUploadService } from './services/investor-document-upload.service';

@Controller('upload')
@UseGuards(JwtGuard)
@Resource('MASTER_ALL')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly investorDocSvc: InvestorDocumentUploadService,
  ) {}

  /**
   * Generic document upload (Document Master prescribed file)
   * POST /upload/document
   */
  @Post('document')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            const uploadPath = join(process.cwd(), 'uploads', 'documents');
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
              console.log('📁 Created upload directory:', uploadPath);
            }
            cb(null, uploadPath);
          } catch (error) {
            console.error('❌ Destination error:', error);
            cb(error, '');
          }
        },
        filename: (_req, file, cb) => {
          try {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `document-${uniqueSuffix}${ext}`;
            console.log('📄 Filename:', filename);
            cb(null, filename);
          } catch (error) {
            console.error('❌ Filename error:', error);
            cb(error, '');
          }
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/plain',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          console.log('✅ File accepted:', file.originalname, file.mimetype);
          cb(null, true);
        } else {
          console.error('❌ Invalid file type:', file.mimetype);
          cb(
            new BadRequestException(`Invalid file type: ${file.mimetype}`),
            false,
          );
        }
      },
      limits: { fileSize: 104_857_600 }, // 100MB
    }),
  )
  uploadDocument(@UploadedFile() file: any, @Req() req: any) {
    const uploadedFile = file || req.file;

    if (!uploadedFile) {
      throw new BadRequestException(
        'No file uploaded. Ensure form field is named "file"',
      );
    }

    // Normalize to relative path from CWD for portability
    const absPath = String(uploadedFile.path).replace(/\\/g, '/');
    const cwd = process.cwd().replace(/\\/g, '/');
    const relativePath = absPath.startsWith(cwd)
      ? absPath.slice(cwd.length + 1)
      : absPath;

    this.logger.log(`✅ Upload successful: ${relativePath}`);

    return {
      success: true,
      path: relativePath,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
    };
    return {
      success: true,
      path: relativePath,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
    };
  }

  /**
   * Tenant logo upload
   * POST /upload/tenant-logo
   *
   * Stores cropped PNG logos in the frontend public img folder and returns
   * a path that can be saved directly in tenants.logo_url, e.g. /img/logo.png.
   */
  @Resource('TENANT_MANAGE')
  @SkipResourceCheck()
  @Post('tenant-logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            const candidates = [
              join(process.cwd(), '..', 'frontend', 'public', 'img'),
              join(process.cwd(), 'apps', 'frontend', 'public', 'img'),
              join(process.cwd(), 'public', 'img'),
            ];
            const uploadPath =
              candidates.find((candidate) => existsSync(candidate)) ??
              candidates[0];

            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          } catch (error) {
            cb(error, '');
          }
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const rawName = file.originalname.replace(/\.[^.]+$/, '');
          const safeName =
            rawName
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 50) || 'tenant-logo';

          cb(null, `${safeName}-${uniqueSuffix}.png`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'image/png') {
          cb(null, true);
          return;
        }

        cb(new BadRequestException('Only PNG logo upload is allowed'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadTenantLogo(@UploadedFile() file: any, @Req() req: any) {
    const uploadedFile = file || req.file;

    if (!uploadedFile) {
      throw new BadRequestException(
        'No file uploaded. Ensure form field is named "file"',
      );
    }

    return {
      success: true,
      path: `/img/${uploadedFile.filename}`,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
    };
  }

  /**
   * Evidence upload for Inspectors (Photos/Videos)
   * POST /upload/evidence
   */
  @Resource('INSPECTOR_DASHBOARD')
  @Post('evidence')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            const uploadPath = join(process.cwd(), 'uploads', 'evidence');
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
              console.log('📁 Created evidence directory:', uploadPath);
            }
            cb(null, uploadPath);
          } catch (error) {
            console.error('❌ Destination error:', error);
            cb(error, '');
          }
        },
        filename: (_req, file, cb) => {
          try {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `evidence-${uniqueSuffix}${ext}`;
            cb(null, filename);
          } catch (error) {
            console.error('❌ Filename error:', error);
            cb(error, '');
          }
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(`Invalid file type: ${file.mimetype}`),
            false,
          );
        }
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for video
    }),
  )
  uploadEvidence(@UploadedFile() file: any, @Req() req: any) {
    const uploadedFile = file || req.file;

    if (!uploadedFile) {
      throw new BadRequestException('No file uploaded.');
    }

    const absPath = String(uploadedFile.path).replace(/\\/g, '/');
    const cwd = process.cwd().replace(/\\/g, '/');
    const relativePath = absPath.startsWith(cwd)
      ? absPath.slice(cwd.length + 1)
      : absPath;

    return {
      success: true,
      path: relativePath,
      filename: uploadedFile.filename,
      mimetype: uploadedFile.mimetype,
    };
  }
  /**
   * Upload investor document file
   * POST /upload/investor-document
   * Form Data:
   *   - file: (binary file)
   *   - documentMasterId: number (used to fetch checklistId & compute next version)
   *
   * Final filename: {uid}_{checklistId}_{version}.{ext}
   */
  @Resource('INVESTOR_DOCUMENTS')
  @Post('investor-document')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: async (req, _file, cb) => {
          try {
            const prisma = (this as unknown as UploadController).prisma;
            const anyReq = req as any;

            // Prefer UID from JWT
            let uid: string | null = anyReq.user?.investorProfileUid ?? null;

            // Fallback: DB lookup if missing
            if (!uid && anyReq.user?.id) {
              try {
                const profile = await prisma.investor_profiles.findUnique({
                  where: { user_id: BigInt(anyReq.user.id) },
                  select: { uid: true },
                });
                uid = profile?.uid ?? null;
              } catch {
                uid = null;
              }
            }

            if (!uid) {
              return cb(new BadRequestException('Investor UID not found'), '');
            }

            anyReq.user = anyReq.user || {};
            anyReq.user.investorProfileUid = uid;

            // Create directory: uploads/investorDocuments/{uid}
            const uploadPath = join(
              process.cwd(),
              'uploads',
              'investorDocuments',
              uid,
            );
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
              console.log(
                '📁 Created investor documents directory:',
                uploadPath,
              );
            }

            cb(null, uploadPath);
          } catch (error) {
            console.error('❌ Investor document destination error:', error);
            cb(error, '');
          }
        },
        filename: (_req, file, cb) => {
          try {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `temp-${uniqueSuffix}${ext}`;
            cb(null, filename);
          } catch (error) {
            console.error('❌ Filename error:', error);
            cb(error, '');
          }
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Allowed: PDF, DOCX, XLSX, JPEG, PNG`,
            ),
            false,
          );
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadInvestorDocument(@UploadedFile() file: any, @Req() req: any) {
    const uploadedFile = file || req.file;

    if (!uploadedFile) {
      throw new BadRequestException(
        'No file uploaded. Ensure form field is named "file"',
      );
    }

    // Expect documentMasterId from form data
    const documentMasterIdRaw =
      (typeof req.body?.documentMasterId === 'string' &&
        req.body.documentMasterId) ||
      (typeof req.body?.documentMasterId === 'number' &&
        req.body.documentMasterId) ||
      null;
    const documentMasterId = Number(documentMasterIdRaw);
    if (!documentMasterId || Number.isNaN(documentMasterId)) {
      throw new BadRequestException(
        'documentMasterId is required in form data',
      );
    }

    const uid = req.user?.investorProfileUid;
    if (!uid) {
      throw new BadRequestException('Investor UID not found on request');
    }

    // Fetch Document Master to get checklistId
    const master = await this.prisma.documentMaster.findUnique({
      where: { id: documentMasterId },
      select: { id: true, checklistId: true },
    });
    if (!master?.checklistId) {
      throw new BadRequestException(
        'Document Master not found or missing checklistId',
      );
    }

    // Compute next version for this investor & master
    const existingDocs = await this.prisma.investorDocument.findMany({
      where: {
        documentMasterId,
        investorProfileUid: uid,
      },
      orderBy: { createdAt: 'desc' },
      select: { documentVersion: true },
    });

    const nextVersion = this.calculateNextVersion(existingDocs); // e.g., "V1.6"

    // Final base name: uid_checklistId_version
    const ext = extname(uploadedFile.originalname);
    const finalBase = `${uid}_${master.checklistId}_${nextVersion}`.replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );
    let finalFilename = `${finalBase}${ext}`;

    const currentPath = String(uploadedFile.path);
    const folder = dirname(currentPath);
    let finalPath = join(folder, finalFilename);

    // Avoid overwriting if same name exists (rare; concurrent uploads)
    if (existsSync(finalPath)) {
      const suffix = Date.now();
      finalFilename = `${finalBase}-${suffix}${ext}`;
      finalPath = join(folder, finalFilename);
      this.logger.warn(
        `File ${finalBase}${ext} already exists. Using ${finalFilename}`,
      );
    }

    // Rename temp -> final
    try {
      renameSync(currentPath, finalPath);
      uploadedFile.filename = finalFilename;
      uploadedFile.path = finalPath;
    } catch (err) {
      console.error('❌ Rename error:', err);
      throw new BadRequestException(
        'Failed to finalize investor document filename',
      );
    }

    // Compress (PNG/JPEG/PDF/XLSX) — pass-through otherwise
    const stats = await this.investorDocSvc.compressExistingFile(
      uploadedFile.path,
      uploadedFile.mimetype,
    );

    // Relative path for frontend
    const absPath = String(uploadedFile.path).replace(/\\/g, '/');
    const cwd = process.cwd().replace(/\\/g, '/');
    const relativePath = absPath.startsWith(cwd)
      ? absPath.slice(cwd.length + 1)
      : absPath;

    const documentReferenceNumber = finalBase; // without extension
    const documentVersion = nextVersion;

    this.logger.log(`✅ Investor document uploaded: ${relativePath}`);

    return {
      success: true,
      message: 'Investor document uploaded successfully',
      data: {
        filePath: relativePath, // uploads/investorDocuments/{uid}/{uid}_{checklistId}_{version}.ext
        fileName: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        size: stats.compressedSizeBytes,
        mimetype: uploadedFile.mimetype,
        documentReferenceNumber,
        documentVersion,
        // Compression stats
        originalSizeBytes: stats.originalSizeBytes,
        compressedSizeBytes: stats.compressedSizeBytes,
        savedBytes: stats.savedBytes,
        savedPercent: stats.savedPercent,
      },
    };
  }

  /** Same logic as in InvestorDocumentService */
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
