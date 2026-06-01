import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVillageDto, UpdateVillageDto } from './dto';

@Injectable()
export class VillageService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.village.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const village = await this.prisma.village.findUnique({
      where: { id },
      include: {
        tehsil: true,
      },
    });

    if (!village) {
      throw new NotFoundException(`Village with ID ${id} not found`);
    }

    return village;
  }

  async create(createVillageDto: CreateVillageDto) {
    return this.prisma.village.create({
      data: createVillageDto,
    });
  }

  async update(id: number, updateVillageDto: UpdateVillageDto) {
    await this.findOne(id);
    return this.prisma.village.update({
      where: { id },
      data: updateVillageDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.village.delete({
      where: { id },
    });
  }

  async toggleStatus(id: number) {
    const village = await this.findOne(id);
    return this.prisma.village.update({
      where: { id },
      data: { isActive: !village.isActive },
    });
  }
}
