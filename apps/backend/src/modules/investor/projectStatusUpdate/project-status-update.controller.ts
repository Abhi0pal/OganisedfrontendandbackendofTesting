import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { SkipResourceCheck } from '../../../common/skip-resource-check.decorator';
import { CreateProjectStatusUpdateDto } from './dto';
import { ProjectStatusUpdateService } from './project-status-update.service';

@Controller('investor/project-status-update')
export class ProjectStatusUpdateController {
  constructor(private readonly service: ProjectStatusUpdateService) {}

  @Get('caf-options')
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async getCafOptions(@Req() req: any) {
    const userId = BigInt(req.user?.id || 0);
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.service.getCafOptions(userId, String(req.query?.serviceId || ''));
  }

  @Post()
  @UseGuards(JwtGuard)
  @SkipResourceCheck()
  async create(@Req() req: any, @Body() dto: CreateProjectStatusUpdateDto) {
    const userId = BigInt(req.user?.id || 0);
    return this.service.create(userId, dto);
  }
}
