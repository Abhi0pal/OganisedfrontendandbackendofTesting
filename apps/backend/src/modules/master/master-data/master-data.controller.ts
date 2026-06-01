import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MasterDataService } from './master-data.service';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';

@Controller('master/data')
export class MasterDataController {
  constructor(private masterDataService: MasterDataService) {}

  /**
   * Get master data by master definition code
   * Query param: master_code (e.g., 'DEPARTMENT', 'SUB_DEPARTMENT')
   * This is public so frontend can fetch dropdown options
   */
  @Public()
  @Get()
  async findByMasterCode(
    @Query('master_code') masterCode: string,
    @Query('is_active') isActive?: string,
    @Query('tenant_id') tenantId?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.is_active = isActive === 'true';
    }

    if (tenantId !== undefined) {
      filters.tenant_id = parseInt(tenantId, 10);
    }

    if (!masterCode) {
      return {
        error: 'master_code query parameter is required',
      };
    }

    return this.masterDataService.findByMasterCode(masterCode, filters);
  }

  /**
   * Get master data filtered by parent_id (for cascading dropdowns)
   * e.g. GET /master/data/by-parent/STATE?parent_id=5  → districts of state 5
   */
  @Public()
  @Get('by-parent/:masterCode')
  async findByParent(
    @Param('masterCode') masterCode: string,
    @Query('parent_id') parentId?: string,
  ) {
    return this.masterDataService.findByParent(masterCode, parentId ? BigInt(parentId) : undefined);
  }

  /**
   * Get master data by master definition ID (paginated)
   * Used by the Dynamic Master Data component to list all records for a master
   * Query params: search, page, limit, is_active
   */
  @Public()
  @Get('by-master/:masterId')
  async findByMasterId(
    @Param('masterId') masterId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('is_active') isActive?: string,
  ) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.is_active = isActive === 'true';
    }

    const pagination = {
      search: search || undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    return this.masterDataService.findByMasterId(parseInt(masterId, 10), filters, pagination);
  }

  /**
   * Get single master data record by ID
   */
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.masterDataService.findOne(BigInt(id));
  }

  /**
   * Get linked master data (for cascading dropdowns)
   * Example: Get sub-departments linked to a selected department
   * @param fromDataId - The source master data ID
   * @param columnKey - The column key in MasterDataReference
   * @param toMasterCode - The target master code (e.g., 'SUB_DEPARTMENT')
   */
  @Public()
  @Get('linked/:fromDataId/:toMasterCode')
  async getLinkedData(
    @Param('fromDataId') fromDataId: string,
    @Param('toMasterCode') toMasterCode: string,
    @Query('columnKey') columnKey: string = 'parent_id',
  ) {
    return this.masterDataService.getLinkedData(
      BigInt(fromDataId),
      columnKey,
      toMasterCode,
    );
  }

  /**
   * Create new master data record (requires auth)
   */
  @UseGuards(JwtGuard)
  @Post()
  async create(@Body() data: any, @Request() req: any) {
    const userId = req.user?.id ? BigInt(req.user.id) : undefined;
    return this.masterDataService.create(data, userId);
  }

  /**
   * Update master data record (requires auth)
   */
  @UseGuards(JwtGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    const userId = req.user?.id ? BigInt(req.user.id) : undefined;
    return this.masterDataService.update(BigInt(id), data, userId);
  }

  /**
   * Toggle active status of master data record (requires auth)
   */
  @UseGuards(JwtGuard)
  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id ? BigInt(req.user.id) : undefined;
    return this.masterDataService.toggleActive(BigInt(id), userId);
  }

  /**
   * Import master data from CSV (requires auth)
   * CSV columns: name, abbr (optional), plus any extra fields
   */
  @UseGuards(JwtGuard)
  @Post(':masterId/import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Param('masterId') masterId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('CSV file is required');
    const userId = req.user?.id ? BigInt(req.user.id) : undefined;
    const csvText = file.buffer.toString('utf-8');
    return this.masterDataService.importFromCsv(parseInt(masterId, 10), csvText, userId);
  }

  /**
   * Delete master data record (requires auth)
   */
  @UseGuards(JwtGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.masterDataService.delete(BigInt(id));
  }
}
