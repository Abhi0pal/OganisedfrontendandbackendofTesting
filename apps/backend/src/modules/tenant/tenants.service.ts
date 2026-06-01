import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PrismaClient } from '@prisma/client';
import { generateTenantId } from './id-generator.utility';

// Version-proof types derived from client methods
type TenantCreateData = Parameters<
  PrismaClient['tenant']['create']
>[0] extends { data: infer D }
  ? D
  : never;
type TenantUpdateData = Parameters<
  PrismaClient['tenant']['update']
>[0] extends { data: infer D }
  ? D
  : never;

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  private normalizeOptionalString(value: unknown) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private sanitizeTenantPayload(data: Record<string, unknown>) {
    const name = this.normalizeOptionalString(data.name);
    const slug = this.normalizeOptionalString(data.slug);
    const domain = this.normalizeOptionalString(data.domain);
    const logoUrl = this.normalizeOptionalString(data.logo_url ?? data.logoUrl);
    const primaryColor = this.normalizeOptionalString(
      data.primary_color ?? data.primaryColor,
    );
    const plan = data.plan;
    const isActive = data.is_active ?? data.isActive;

    const sanitized: Record<string, unknown> = {};

    if (name !== undefined) sanitized.name = name;
    if (slug !== undefined) sanitized.slug = slug;
    if (domain !== undefined) sanitized.domain = domain;
    if (logoUrl !== undefined) sanitized.logo_url = logoUrl;
    if (primaryColor !== undefined) sanitized.primary_color = primaryColor;
    if (plan !== undefined) sanitized.plan = plan;
    if (typeof isActive === 'boolean') sanitized.is_active = isActive;

    return sanitized;
  }

  private normalizeTenantName(rawName: string | null | undefined) {
    return String(rawName || '').trim();
  }

  private async ensureUniqueTenantName(rawName: string | null | undefined, excludeId?: number) {
    const normalizedName = this.normalizeTenantName(rawName);

    if (!normalizedName) {
      return normalizedName;
    }

    const existing = await this.prisma.tenant.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' },
      },
      select: { id: true, name: true },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Tenant name already exists');
    }

    return normalizedName;
  }

  private async resolveUniqueSlug(rawSlug: string | null | undefined, excludeId?: number) {
    const baseSlug = String(rawSlug || '')
      .trim()
      .toLowerCase();

    if (!baseSlug) {
      return '';
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  async create(data: TenantCreateData) {
    const sanitizedData = this.sanitizeTenantPayload(data as Record<string, unknown>);

    // Get the max ID to calculate the next ID
    const maxTenant = await this.prisma.tenant.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const nextId = (maxTenant?.id ?? 0) + 1;
    const tenantId = generateTenantId(nextId);
    const normalizedName = await this.ensureUniqueTenantName(
      sanitizedData.name as string | null | undefined,
    );

    if (!normalizedName) {
      throw new BadRequestException('Tenant name is required');
    }

    const slug = await this.resolveUniqueSlug(
      sanitizedData.slug as string | null | undefined,
    );

    if (!slug) {
      throw new BadRequestException('Tenant slug is required');
    }

    // Create tenant with the ID already set
    return this.prisma.tenant.create({
      data: {
        ...(sanitizedData as TenantCreateData),
        name: normalizedName,
        slug,
        tenant_ID: tenantId,
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: number) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async update(id: number, data: TenantUpdateData) {
    const updateData: TenantUpdateData = {
      ...(this.sanitizeTenantPayload(data as Record<string, unknown>) as TenantUpdateData),
    };

    if (typeof data.name === 'string') {
      updateData.name = await this.ensureUniqueTenantName(data.name, id);
    }

    if (typeof data.slug === 'string') {
      updateData.slug = await this.resolveUniqueSlug(data.slug, id);
    }

    return this.prisma.tenant.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    return this.prisma.tenant.delete({ where: { id } });
  }

  async getThemes(id: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return [];
    }
    return tenant.availableThemes || [];
  }
}
