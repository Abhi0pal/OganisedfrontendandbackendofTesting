import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateIssuerDto, UpdateIssuerDto } from './dto';

@Injectable()
export class IssuerService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.issuer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const issuer = await this.prisma.issuer.findUnique({
      where: { id },
    });

    if (!issuer) {
      throw new NotFoundException(`Issuer with ID ${id} not found`);
    }

    return issuer;
  }

  async create(createIssuerDto: CreateIssuerDto) {
    return this.prisma.issuer.create({
      data: createIssuerDto,
    });
  }

  async update(id: number, updateIssuerDto: UpdateIssuerDto) {
    await this.findOne(id);
    return this.prisma.issuer.update({
      where: { id },
      data: updateIssuerDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.issuer.delete({
      where: { id },
    });
  }

  async toggleStatus(id: number) {
    const issuer = await this.findOne(id);
    return this.prisma.issuer.update({
      where: { id },
      data: { isIssuerActive: !issuer.isIssuerActive },
    });
  }
}
