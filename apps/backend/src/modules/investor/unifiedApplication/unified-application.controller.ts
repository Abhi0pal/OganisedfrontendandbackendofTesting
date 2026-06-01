import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { SkipResourceCheck } from '../../../common/skip-resource-check.decorator';
import { UnifiedApplicationService } from './unified-application.service';
import { SaveUnifiedApplicationDto } from './dto/save-unified-application.dto';
import { UpdateUnifiedApplicationDto } from './dto/update-unified-application.dto';

@Controller('investor/departmentservice/unifiedapplication')
export class UnifiedApplicationController {
  constructor(private readonly service: UnifiedApplicationService) {}

  @Get('applications')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getApplications(@Req() req: any, @Query('serviceId') serviceId?: string) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.service.getApplications({ userId, serviceId });
  }

  @Get('draft')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getDraft(@Req() req: any, @Query('submissionId') submissionId?: string) {
    const userId = BigInt(req.user?.id || 0);
    const parsedId = Number(submissionId);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('submissionId is required');
    }
    return this.service.getDraftApplication({
      userId,
      submissionId: parsedId,
    });
  }

  @Post('save')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async save(@Req() req: any, @Body() body: SaveUnifiedApplicationDto) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.service.saveApplication({
      userId,
      body,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
  }

  @Post('update')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async update(@Req() req: any, @Body() body: UpdateUnifiedApplicationDto) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.service.updateApplication({
      userId,
      body,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
  }

  @Post('architect/lookup')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async architectLookup(@Body('architectNo') architectNo?: string) {
    if (!String(architectNo || '').trim()) {
      throw new BadRequestException('architectNo is required');
    }
    return this.service.findArchitectByNo(String(architectNo));
  }
}
