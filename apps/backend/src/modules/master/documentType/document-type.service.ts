import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from './dto';

@Injectable()
export class DocumentTypeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.documentType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const documentType = await this.prisma.documentType.findUnique({
      where: { id },
    });

    if (!documentType) {
      throw new NotFoundException(`Document Type with ID ${id} not found`);
    }

    return documentType;
  }

  async create(createDocumentTypeDto: CreateDocumentTypeDto) {
    return this.prisma.documentType.create({
      data: createDocumentTypeDto,
    });
  }

  async update(id: number, updateDocumentTypeDto: UpdateDocumentTypeDto) {
    await this.findOne(id);
    return this.prisma.documentType.update({
      where: { id },
      data: updateDocumentTypeDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.documentType.delete({
      where: { id },
    });
  }

  async toggleStatus(id: number) {
    const documentType = await this.findOne(id);
    return this.prisma.documentType.update({
      where: { id },
      data: { isDocActive: !documentType.isDocActive },
    });
  }
}
