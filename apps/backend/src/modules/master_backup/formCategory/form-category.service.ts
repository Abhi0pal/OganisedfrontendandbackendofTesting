
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateFormCategoryDto } from './dto/create-form-category.dto';
import { UpdateFormCategoryDto } from './dto/update-form-category.dto';

@Injectable()
export class FormCategoryService {
  constructor(private prisma: PrismaService) {}

  private pad3(n: number) {
    return String(n).padStart(3, '0');
  }

  /**
   * Compute the next id as MAX(id)+1 and bump the underlying sequence
   * to that value so future inserts (that rely on nextval) stay in sync.
   * We return nextId so the caller can insert with an explicit id and
   * never hit P2002 on `id` even if the global sequence was behind.
   */
  private async nextIdAndBumpSeq(tx: Prisma.TransactionClient): Promise<number> {
    // 1) Compute next id from current table contents
    const rows = await tx.$queryRaw<Array<{ next_id: number }>>`
      SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM "m_fb_form_categories"
    `;
    const nextId = rows?.[0]?.next_id ?? 1;

    // 2) Bump the sequence to that value (treated as already returned)
    //    so the next nextval() becomes nextId+1
    await tx.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('m_fb_form_categories','id'),
        ${nextId},
        true
      );
    `);

    return nextId;
  }

  async create(data: CreateFormCategoryDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const parentId = data.parentId ?? 0;

      // === ROOT path ===
      if (parentId === 0) {
        // Pre-allocate a fresh id and bump the sequence to keep it in sync
        const id = await this.nextIdAndBumpSeq(tx);
        const code = `UK-CAT-${this.pad3(id)}_0`;

        return tx.formCategory.create({
          data: {
            id, // explicit id avoids depending on possibly stale sequence
            categoryName: data.categoryName,
            nameInHindi: data.nameInHindi ?? null,
            nameAlt: data.nameAlt ?? null,
            parentId: 0,
            isActive: data.isActive ?? true,
            created: new Date(),
            categoryCode: code, // final code in one step
          },
        });
      }

      // === CHILD path ===
      // Validate parent exists
      const parent = await tx.formCategory.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new BadRequestException(`Parent category ${parentId} not found`);
      }

      // Count children for suffix (_1, _2, ...)
      const childrenCount = await tx.formCategory.count({ where: { parentId } });
      const code = `UK-CAT-${this.pad3(parentId)}_${childrenCount + 1}`;

      // Pre-allocate id and bump sequence
      const id = await this.nextIdAndBumpSeq(tx);

      return tx.formCategory.create({
        data: {
          id,
          categoryName: data.categoryName,
          nameInHindi: data.nameInHindi ?? null,
          nameAlt: data.nameAlt ?? null,
          parentId,
          isActive: data.isActive ?? true,
          created: new Date(),
          categoryCode: code, // final code in one step
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
        { categoryName: { contains: filters.search, mode: 'insensitive' } },
        { nameAlt: { contains: filters.search, mode: 'insensitive' } },
        { nameInHindi: { contains: filters.search, mode: 'insensitive' } },
        { categoryCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.formCategory.findMany({
      where,
      orderBy: [{ parentId: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.formCategory.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateFormCategoryDto) {
    return this.prisma.formCategory.update({ where: { id }, data });
  }

  async delete(id: number) {
    // Guard: prevent deleting a category that still has fields
    const fields = await this.prisma.formField.count({ where: { categoryId: id } });
    if (fields > 0) throw new BadRequestException('Category has fields; delete/reattach them first.');
    return this.prisma.formCategory.delete({ where: { id } });
  }

  async toggle(id: number) {
    const rec = await this.findOne(id);
    return this.prisma.formCategory.update({ where: { id }, data: { isActive: !rec?.isActive } });
  }
}
