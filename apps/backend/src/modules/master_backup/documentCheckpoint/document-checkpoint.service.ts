import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDocumentCheckpointDto, UpdateDocumentCheckpointDto } from './dto';

@Injectable()
export class DocumentCheckpointService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.documentCheckpoint.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    const checkpoint = await this.prisma.documentCheckpoint.findUnique({
      where: { id },
    });

    if (!checkpoint) {
      throw new NotFoundException(`Document Checkpoint with ID ${id} not found`);
    }

    return checkpoint;
  }

  async create(createDocumentCheckpointDto: CreateDocumentCheckpointDto) {
    // Check if code already exists
    const existingCheckpoint = await this.prisma.documentCheckpoint.findUnique({
      where: { code: createDocumentCheckpointDto.code },
    });

    if (existingCheckpoint) {
      throw new ConflictException(
        `Document Checkpoint with code "${createDocumentCheckpointDto.code}" already exists`
      );
    }

    return this.prisma.documentCheckpoint.create({
      data: createDocumentCheckpointDto,
    });
  }

  async update(id: number, updateDocumentCheckpointDto: UpdateDocumentCheckpointDto) {
    await this.findOne(id);

    // Check code conflict if being updated
    if (updateDocumentCheckpointDto.code) {
      const existingCheckpoint = await this.prisma.documentCheckpoint.findUnique({
        where: { code: updateDocumentCheckpointDto.code },
      });

      if (existingCheckpoint && existingCheckpoint.id !== id) {
        throw new ConflictException(
          `Document Checkpoint with code "${updateDocumentCheckpointDto.code}" already exists`
        );
      }
    }

    return this.prisma.documentCheckpoint.update({
      where: { id },
      data: updateDocumentCheckpointDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.documentCheckpoint.delete({
      where: { id },
    });
  }

  async toggleStatus(id: number) {
    const checkpoint = await this.findOne(id);
    return this.prisma.documentCheckpoint.update({
      where: { id },
      data: { isActive: !checkpoint.isActive },
    });
  }
}
