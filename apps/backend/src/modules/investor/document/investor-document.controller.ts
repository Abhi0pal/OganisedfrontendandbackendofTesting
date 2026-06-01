import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { InvestorDocumentService } from './investor-document.service';
import { CreateInvestorDocumentDto } from './dto/create-investor-document.dto';
import { UpdateInvestorDocumentDto } from './dto/update-investor-document.dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';

@Controller('investor/documents')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('INVESTOR_DOCUMENTS')
export class InvestorDocumentController {
  constructor(
    private readonly investorDocumentService: InvestorDocumentService,
  ) {}

  /**
   * Create a new investor document
   * POST /investor/documents
   */
  @Post()
  async create(@Body() dto: CreateInvestorDocumentDto, @Req() req: any) {
    if (!dto.documentPath) {
      throw new BadRequestException('Document path is required');
    }
    const userId = BigInt(req.user.id);
    return this.investorDocumentService.create(dto, userId);
  }

  /**
   * Get all documents for current investor
   * GET /investor/documents
   */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = BigInt(req.user.id);
    const parsedPage =
      Number.isFinite(Number(page)) && Number(page) > 0
        ? Number(page)
        : undefined;
    const parsedLimit =
      Number.isFinite(Number(limit)) && Number(limit) > 0
        ? Number(limit)
        : undefined;
    return this.investorDocumentService.findAll(userId, {
      page: parsedPage,
      limit: parsedLimit,
    });
  }

  /**
   * Get document statistics
   * GET /investor/documents/stats
   */
  @Get('stats')
  async getStats(@Req() req: any) {
    const userId = BigInt(req.user.id);
    return this.investorDocumentService.getDocumentStats(userId);
  }

  /**
   * Get version history
   * GET /investor/documents/versions/:documentMasterId
   */
  @Get('versions/:documentMasterId')
  async getVersionHistory(
    @Param('documentMasterId') masterId: string,
    @Req() req: any,
  ) {
    const userId = BigInt(req.user.id);
    return this.investorDocumentService.getVersionHistory(
      parseInt(masterId, 10),
      userId,
    );
  }

  /**
   * Get single document by ID
   * GET /investor/documents/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = BigInt(req.user.id);
    return this.investorDocumentService.findOne(BigInt(id), userId);
  }

  /**
   * Update document
   * PUT /investor/documents/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInvestorDocumentDto,
    @Req() req: any,
  ) {
    const userId = BigInt(req.user.id);
    return this.investorDocumentService.update(BigInt(id), dto, userId);
  }

  /**
   * Delete document
   * DELETE /investor/documents/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = BigInt(req.user.id);
    return this.investorDocumentService.remove(BigInt(id), userId);
  }
}
