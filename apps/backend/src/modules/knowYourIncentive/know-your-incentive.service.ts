import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KnowYourIncentiveService {
  constructor(private prisma: PrismaService) {}

  async getMsmeYearByPolicy(policyId: number) {
    const records = await this.prisma.kyiIcCalculator.findMany({
      where: {
        policy_id: policyId,
        isActive: true,
      },
      select: {
        msmeYear: true, // This fetches the details from the UnitCategories master table
      },
    });

    // Extract unitCategory, filter out nulls, and remove duplicates based on ID
    const msmeYears = records
      .map((r) => r.msmeYear)
      .filter((cat) => cat !== null);

    // Use a Map to ensure uniqueness by ID
    const uniqueCategories = [
      ...new Map(msmeYears.map((item) => [item.id, item])).values(),
    ];

    return uniqueCategories;
  }

  async getFilteredIncentives(query: any) {
    const {
      policy_id,
      unit_type_value,
      sector_value,
      sub_sector_value,
      msme_year_value,
      unit_category_value,
      land_type_value,
      block_value,
    } = query;

    // Helper to safely parse Integers or return null
    const parseSafe = (val: any) => (val && val !== '' ? parseInt(val) : null);

    const unitType = parseSafe(unit_type_value);
    const sector = parseSafe(sector_value);
    const subSector = parseSafe(sub_sector_value);
    const msmeYear = parseSafe(msme_year_value);
    const unitCategory = parseSafe(unit_category_value);
    const landType = parseSafe(land_type_value);
    const block = parseSafe(block_value);
    const policyIdNum = Number(policy_id); // ensure it's a number

    return this.prisma.kyiIcCalculator.findMany({
      where: {
        isActive: true,
        policy_id: policyIdNum || undefined,

        AND: [
          // Using a helper pattern to avoid empty OR arrays
          { OR: [{ unit_type_value: unitType }, { unit_type_value: null }] },
          { OR: [{ sector_value: sector }, { sector_value: null }] },
          { OR: [{ sub_sector_value: subSector }, { sub_sector_value: null }] },
          { OR: [{ msme_year_value: msmeYear }, { msme_year_value: null }] },
          { OR: [{ unit_category_value: unitCategory }, { unit_category_value: null }] },
          { OR: [{ land_type_value: landType }, { land_type_value: null }] },
          { OR: [{ block_value: block }, { block_value: null }] },
        ],
      },
      include: {
        policy: { select: { policy_name: true } },
        incentiveType: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    });
  }
}