import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { DocumentMasterService } from './document-master.service';
import { CreateDocumentMasterDto, UpdateDocumentMasterDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { join } from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

@Controller('document-masters')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class DocumentMasterController {
  constructor(private readonly documentMasterService: DocumentMasterService) {}

  @Resource('MASTER_DOCUMENT_MASTERS_READ')
  @Get()
  findAll() {
    return this.documentMasterService.findAll();
  }

  @Resource('MASTER_DOCUMENT_MASTERS_READ')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentMasterService.findOne(id);
  }

  @Post()
  create(@Body() createDocumentMasterDto: CreateDocumentMasterDto) {
    return this.documentMasterService.create(createDocumentMasterDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentMasterDto: UpdateDocumentMasterDto,
  ) {
    return this.documentMasterService.update(id, updateDocumentMasterDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentMasterService.remove(id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.documentMasterService.toggleStatus(id);
  }

  // ✅ File viewer endpoint
  @Get('view/:filename')
  async viewFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads/documents', filename);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }
    return res.sendFile(filePath);
  }
}
