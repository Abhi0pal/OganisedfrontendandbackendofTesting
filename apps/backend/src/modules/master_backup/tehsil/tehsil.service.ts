import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTehsilDto, UpdateTehsilDto } from './dto';

@Injectable()
export class TehsilService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tehsil.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const tehsil = await this.prisma.tehsil.findUnique({
      where: { id },
      include: {
        district: true,
        state: true,
      },
    });

    if (!tehsil) {
      throw new NotFoundException(`Tehsil with ID ${id} not found`);
    }

    return tehsil;
  }

  async create(createTehsilDto: CreateTehsilDto) {
    return this.prisma.tehsil.create({
      data: createTehsilDto,
    });
  }

  async update(id: number, updateTehsilDto: UpdateTehsilDto) {
    await this.findOne(id);
    return this.prisma.tehsil.update({
      where: { id },
      data: updateTehsilDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tehsil.delete({
      where: { id },
    });
  }

  async toggleStatus(id: number) {
    const tehsil = await this.findOne(id);
    return this.prisma.tehsil.update({
      where: { id },
      data: { isActive: !tehsil.isActive },
    });
  }
}
