import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, renameSync } from 'fs';
import { SkipResourceCheck } from '../../../common/skip-resource-check.decorator';
import { Public } from '../../../common/public.decorator';
import { InprincipleService } from './inprinciple.service';
import { SubmitInprincipleDto, UpdateInprincipleDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';

const uploadDir = './uploads/inprinciple';

@Controller('investor/inprinciple')
export class InprincipleController {
  constructor(private readonly inprincipleService: InprincipleService) {}

  @Get('documents')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getDocuments(@Query('serviceId') serviceId?: string) {
    if (!serviceId) {
      throw new BadRequestException('serviceId is required');
    }
    return this.inprincipleService.getDocumentChecklist(serviceId);
  }

  @Get('documents/uploads')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getUploadedDocuments(
    @Req() req: any,
    @Query('submissionId') submissionId?: string,
  ) {
    if (!submissionId) {
      throw new BadRequestException('submissionId is required');
    }
    const anyReq = req;
    const userId = BigInt(anyReq.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.inprincipleService.getUploadedDocuments(
      Number(submissionId),
      userId,
    );
  }

  @Post('documents/upload')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const anyReq = req as any;
          const uid = anyReq.user?.investorProfileUid;
          if (!uid) {
            return cb(new BadRequestException('Investor UID not found'), '');
          }
          const dir = join(process.cwd(), 'uploads', 'investorDocuments', uid);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const uniqueName = Date.now() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadChecklistDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() body: any,
  ) {
    if (!file) {
      throw new BadRequestException('File upload failed');
    }
    const submissionId = Number(body.submissionId);
    const documentMasterId = Number(body.documentMasterId);
    if (!submissionId || !documentMasterId) {
      throw new BadRequestException(
        'submissionId and documentMasterId are required',
      );
    }

    const anyReq = req;
    const userId = BigInt(anyReq.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    const uploadType = body.uploadType === 'duplicate' ? 'duplicate' : 'new';
    const ipAddress =
      req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    const result = await this.inprincipleService.uploadSupportingDocument({
      submissionId,
      documentMasterId,
      uploadType,
      comments: body.comments || '',
      validFrom: body.validFrom || '',
      validTo: body.validTo || '',
      docDateOfIssuance: body.docDateOfIssuance || '',
      isDocumentActive: body.isDocumentActive || 'Y',
      filePath: file.path,
      fileName: file.filename,
      originalName: file.originalname,
      userId,
      ipAddress,
      userAgent,
    });

    const uid = anyReq.user?.investorProfileUid;
    if (!uid) {
      throw new BadRequestException('Investor UID not found');
    }

    const finalName = result.documentName;
    const finalPath = join(
      process.cwd(),
      'uploads',
      'investorDocuments',
      uid,
      finalName,
    );
    if (file.path !== finalPath) {
      renameSync(file.path, finalPath);
    }

    const relativePath = `uploads/investorDocuments/${uid}/${finalName}`;

    return {
      success: true,
      data: {
        documentsId: result.documentsId,
        checklistId: result.checklistId,
        fileName: finalName,
        filePath: relativePath,
        docRefNumber: result.docRefNumber,
        versionType: result.versionType,
        version: result.version,
      },
    };
  }

  @Get('payment')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getPayments(
    @Req() req: any,
    @Query('submissionId') submissionId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    const parsedId = Number(submissionId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.inprincipleService.getPaymentDetails(parsedId, userId);
  }

  @Post('payment/create')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async createPayment(@Req() req: any, @Body() body: any) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    const submissionId = Number(body.submissionId);
    if (!Number.isFinite(submissionId) || submissionId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    const amount = Number(body.amount || 0);
    const paymentMode = body.paymentMode || 'PayGov';
    const result = await this.inprincipleService.createPayment({
      submissionId,
      userId,
      amount,
      paymentMode,
    });
    return { payment: result };
  }

  @Post('payment/update')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async updatePayment(@Req() req: any, @Body() body: any) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    const paymentId = Number(body.paymentId);
    if (!Number.isFinite(paymentId) || paymentId <= 0) {
      throw new BadRequestException('paymentId is required');
    }
    const statusCode = body.statusCode === 'S' ? 'S' : 'F';
    const result = await this.inprincipleService.updatePaymentStatus({
      paymentId,
      userId,
      statusCode,
    });
    return { payment: result };
  }

  @Get('applications')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getApplications(
    @Req() req: any,
    @Query('serviceId') serviceId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.inprincipleService.getInvestorApplications({
      userId,
      serviceId,
    });
  }

  @Get('caf-options')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getCafOptions(@Req() req: any) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.inprincipleService.getCafOptions(userId);
  }

  @Get('approved-sb')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getApprovedSbList(
    @Req() req: any,
    @Query('serviceId') serviceId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.inprincipleService.getApprovedSbList({ userId, serviceId });
  }

  @Get('approved-sb/view')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getApprovedSbSubmission(
    @Req() req: any,
    @Query('submissionId') submissionId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    const parsedId = Number(submissionId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.inprincipleService.getApprovedSbSubmission({
      userId,
      submissionId: parsedId,
    });
  }

  @Get('draft')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getDraft(
    @Req() req: any,
    @Query('submissionId') submissionId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    const parsedId = Number(submissionId);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.inprincipleService.getDraftApplication({
      userId,
      submissionId: parsedId,
    });
  }

  @Get('view')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getView(@Req() req: any, @Query('submissionId') submissionId?: string) {
    const userId = BigInt(req.user?.id || 0);
    const parsedId = Number(submissionId);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.inprincipleService.getApplicationView({
      userId,
      submissionId: parsedId,
    });
  }

  @Get('history')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getHistory(
    @Req() req: any,
    @Query('submissionId') submissionId?: string,
  ) {
    const userId = BigInt(req.user?.id || 0);
    const parsedId = Number(submissionId);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.inprincipleService.getApplicationHistory({
      userId,
      submissionId: parsedId,
    });
  }

  @Post('submit')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async submit(@Body() data: SubmitInprincipleDto, @Req() req: any) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    return this.inprincipleService.submitDraftApplication({
      userId,
      serviceId: data.serviceId,
      departmentId: data.departmentId,
      formTypeId: data.formTypeId,
      processingLevel: data.processingLevel,
      formData: data.formData,
      unitName: data.unitName,
      districtId: data.districtId,
      cafType: data.cafType,
      parentSubId: data.parentSubId,
      cafId: data.cafId,
      existingUbuId: data.existingUbuId,
      revertedCallBackUrl: data.revertedCallBackUrl,
      printAppCallBackUrl: data.printAppCallBackUrl,
      downloadCertificateCallBackUrl: data.downloadCertificateCallBackUrl,
      currentStep: data.currentStep,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
  }

  @Post('update')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async update(@Body() data: UpdateInprincipleDto, @Req() req: any) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    return this.inprincipleService.updateDraftApplication({
      submissionId: data.submissionId,
      userId,
      serviceId: data.serviceId,
      departmentId: data.departmentId,
      formTypeId: data.formTypeId,
      processingLevel: data.processingLevel,
      formData: data.formData,
      unitName: data.unitName,
      districtId: data.districtId,
      cafType: data.cafType,
      existingUbuId: data.existingUbuId,
      revertedCallBackUrl: data.revertedCallBackUrl,
      printAppCallBackUrl: data.printAppCallBackUrl,
      downloadCertificateCallBackUrl: data.downloadCertificateCallBackUrl,
      currentStep: data.currentStep,
      isFinalSubmit: data.isFinalSubmit,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
  }

  @Post('upload')
  @Public()
  @SkipResourceCheck()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/pdf|jpeg|jpg|png/)) {
          return cb(
            new BadRequestException('Only PDF / JPG / PNG files allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File upload failed');
    }

    return {
      filePath: `/uploads/inprinciple/${file.filename}`,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
