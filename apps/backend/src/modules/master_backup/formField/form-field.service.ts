
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateFormFieldDto, UpdateFormFieldDto } from './dto';

@Injectable()
export class FormFieldService {
  constructor(private prisma: PrismaService) { }

  private pad5(n: number) {
    return String(n).padStart(5, '0');
  }

  /**
   * Compute the next available ROOT code as:
   *   UK-FCL-<pad5(MAX(numeric among existing roots) + 1)>_0
   * This avoids collisions even if there are gaps in legacy codes.
   */
  private async nextRootCode(tx: Prisma.TransactionClient): Promise<string> {
    // Extract the 5-digit number from 'UK-FCL-xxxxx_0' and compute MAX among existing ROOTS (parent_id=0)
    const rows = await tx.$queryRaw<Array<{ max_num: number | null }>>`
      SELECT COALESCE(
               MAX(CAST(SUBSTRING(formchk_id FROM 'UK-FCL-(\\d{5})') AS INTEGER)),
               0
             ) AS max_num
      FROM "m_fb_form_field"
      WHERE parent_id = 0;
    `;
    const next = (rows?.[0]?.max_num ?? 0) + 1;
    return `UK-FCL-${this.pad5(next)}_0`;
  }

  async create(data: CreateFormFieldDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const hasCategory =
        data.categoryId !== undefined && data.categoryId !== null && !Number.isNaN(Number(data.categoryId));
      const categoryId = hasCategory ? Number(data.categoryId) : null;

      // Optional category: create as an independent root field (parentId = 0)
      if (!hasCategory) {
        let rootCode = await this.nextRootCode(tx);
        try {
          return await tx.formField.create({
            data: {
              parentId: 0,
              categoryId: null,
              name: data.name.trim(),
              nameInHindi: data.nameInHindi?.trim() || null,
              isActive: data.isActive ?? true,
              formCheckId: rootCode,
            },
          });
        } catch (err) {
          if ((err as any)?.code !== 'P2002') throw err;
          rootCode = await this.nextRootCode(tx);
          return tx.formField.create({
            data: {
              parentId: 0,
              categoryId: null,
              name: data.name.trim(),
              nameInHindi: data.nameInHindi?.trim() || null,
              isActive: data.isActive ?? true,
              formCheckId: rootCode,
            },
          });
        }
      }

      // Ensure category exists
      const cat = await tx.formCategory.findUnique({ where: { id: categoryId! } });
      if (!cat) throw new BadRequestException(`FormCategory ${categoryId} not found`);

      // 1) Find existing field ROOT for this category
      let root = await tx.formField.findFirst({
        where: { parentId: 0, categoryId: categoryId! },
        select: { id: true, formCheckId: true },
      });

      // 2) If no root, create a new ROOT with a collision-proof code
      if (!root) {
        // Compute proposed root code from MAX numeric
        let rootCode = await this.nextRootCode(tx);

        // Try to create; in the unlikely event of a race, recompute & retry once.
        try {
          const createdRoot = await tx.formField.create({
            data: {
              parentId: 0,
              categoryId: categoryId!,
              name: cat.categoryName, // section label mirrors category
              nameInHindi: cat.nameInHindi ?? null,
              isActive: data.isActive ?? true,
              formCheckId: rootCode,
            },
            select: { id: true, formCheckId: true },
          });
          root = createdRoot;
        } catch (err) {
          const code = (err as any)?.code;
          if (code === 'P2002') {
            // Unique violation on formchk_id - recompute and retry once
            rootCode = await this.nextRootCode(tx);
            const createdRoot = await tx.formField.create({
              data: {
                parentId: 0,
                categoryId: categoryId!,
                name: cat.categoryName,
                nameInHindi: cat.nameInHindi ?? null,
                isActive: data.isActive ?? true,
                formCheckId: rootCode,
              },
              select: { id: true, formCheckId: true },
            });
            root = createdRoot;
          } else {
            throw err;
          }
        }
      }

      // 3) Create the CHILD with FINAL code (no TEMP)
      const base = root.formCheckId.replace(/_0$/, '');
      const childrenCount = await tx.formField.count({ where: { parentId: root.id } });
      const suffix = childrenCount + 1; // first child becomes _1
      const childCode = `${base}_${suffix}`;

      return tx.formField.create({
        data: {
          parentId: root.id,
          categoryId: categoryId!,
          name: data.name.trim(),
          nameInHindi: data.nameInHindi?.trim() || null,
          isActive: data.isActive ?? true,
          formCheckId: childCode,
        },
      });
    });
  }

  async findAll(filters?: { isActive?: boolean; search?: string; parentId?: number }) {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.parentId !== undefined) where.parentId = filters.parentId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { formCheckId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.formField.findMany({
      where,
      orderBy: [{ parentId: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.formField.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateFormFieldDto) {
    return this.prisma.formField.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.formField.delete({ where: { id } });
  }

  async toggle(id: number) {
    const rec = await this.findOne(id);
    return this.prisma.formField.update({
      where: { id },
      data: { isActive: !rec?.isActive },
    });
  }
}
