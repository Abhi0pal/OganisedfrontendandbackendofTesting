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
} from '@nestjs/common';
import { DocumentTypeService } from './document-type.service';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';

@Controller('document-types')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class DocumentTypeController {
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

  @Post()
  create(@Body() createDocumentTypeDto: CreateDocumentTypeDto) {
    return this.documentTypeService.create(createDocumentTypeDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentTypeDto: UpdateDocumentTypeDto,
  ) {
    return this.documentTypeService.update(id, updateDocumentTypeDto);
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
