import { PrismaClient, ServiceStatus } from '@prisma/client';
import { normalizeServiceId } from './utils/service-id.util';
import { servicesData } from './data/services.data';

export async function seedServices(prisma: PrismaClient) {
  try {
    console.log('Seeding Services...');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of servicesData) {
      let issuerIdFromDept: number | null = null;

      if (item.department_id != null) {
        const dept = await prisma.department.findUnique({
          where: { id: item.department_id },
        });

        if (!dept) {
          console.warn(
            `Skipping Service (service_id=${item.service_id}) - Department ${item.department_id} not found`
          );
          skipped += 1;
          continue;
        }

        issuerIdFromDept = dept.issuerId ?? null;
      }

      const issuerId = item.issuer_id ?? issuerIdFromDept;

      const serviceStatus = item.service_status
        ? (item.service_status as ServiceStatus)
        : ServiceStatus.NOT_APPLICABLE;

      const exists = await prisma.service.findUnique({
        where: { id: item.id },
      });

      const payload = {
        service_id: item.service_id ? normalizeServiceId(item.service_id) : null,
        department_id: item.department_id ?? null,
        issuer_id: issuerId,
        swcs_service_id: item.swcs_service_id ?? null,
        service_level: item.service_level ?? null,
        document_checklist: (item as any).document_checklist ?? null,
        document_checklist_mapping:
          (item as any).document_checklist_mapping ?? null,
        document_type_mapping: (item as any).document_type_mapping ?? null,
        document_checkpoint_mapping:
          (item as any).document_checkpoint_mapping ?? null,
        comments: (item as any).comments ?? null,
        service_name: item.service_name ?? null,
        is_in_SWCS_act:
          item.is_in_SWCS_act === null ? undefined : item.is_in_SWCS_act === 1,
        is_integrated_with_dms:
          item.is_integrated_with_dms === null
            ? undefined
            : item.is_integrated_with_dms === 1,
        service_status: serviceStatus,
        isActive: item.isActive === null ? undefined : item.isActive === 1,
        user_agent: item.user_agent ?? null,
        ipaddress: item.ipaddress ?? null,
        service_go_live_date: item.service_go_live_date
          ? new Date(item.service_go_live_date)
          : undefined,
        service_end_date: item.service_end_date
          ? new Date(item.service_end_date)
          : undefined,
      };

      await prisma.service.upsert({
        where: { id: item.id },
        update: {
          ...payload,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        },
        create: {
          id: item.id,
          ...payload,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        },
      });

      if (exists) updated += 1;
      else inserted += 1;
    }

    console.log(
      `Services seeding completed. updated: ${updated}, inserted: ${inserted}, skipped: ${skipped}`
    );
  } catch (error) {
    console.error('Error seeding Services:', error);
  }
}
