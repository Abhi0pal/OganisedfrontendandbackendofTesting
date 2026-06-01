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
import { DocumentCheckpointService } from './document-checkpoint.service';
import { CreateDocumentCheckpointDto, UpdateDocumentCheckpointDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';

@Controller('document-checkpoints')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class DocumentCheckpointController {
  constructor(private readonly documentCheckpointService: DocumentCheckpointService) {}

  @Get()
  findAll() {
    return this.documentCheckpointService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentCheckpointService.findOne(id);
  }

  @Post()
  create(@Body() createDocumentCheckpointDto: CreateDocumentCheckpointDto) {
    return this.documentCheckpointService.create(createDocumentCheckpointDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentCheckpointDto: UpdateDocumentCheckpointDto,
  ) {
    return this.documentCheckpointService.update(id, updateDocumentCheckpointDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentCheckpointService.remove(id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.documentCheckpointService.toggleStatus(id);
  }
}
