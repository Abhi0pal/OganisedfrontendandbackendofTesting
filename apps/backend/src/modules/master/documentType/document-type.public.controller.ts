
import {
  Controller, Get, Param, ParseIntPipe,
  UseGuards, Post, Patch, Delete, Body,
} from '@nestjs/common';
import { DocumentTypeService } from './document-type.service';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from './dto';

// Root alias: /document-types
@Controller('document-types')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class DocumentTypePublicController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Resource('MASTER_DOCUMENT_TYPES_READ')
  @Get()
  findAll() {
    return this.documentTypeService.findAll();
  }

  @Resource('MASTER_DOCUMENT_TYPES_READ')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentTypeService.findOne(id);
  }

  // (Optional) If you also want admin ops at root; otherwise remove these 3:
  @Post()
  create(@Body() dto: CreateDocumentTypeDto) {
    return this.documentTypeService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDocumentTypeDto) {
    return this.documentTypeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentTypeService.remove(id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.documentTypeService.toggleStatus(id);
  }
}
