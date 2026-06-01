import { PrismaClient } from '@prisma/client';
import { actPolicyNotificationAmendmentData } from './data/act-policy-notification-amendment.data';

export async function seedActPolicyNotificationAmendments(prisma: PrismaClient) {
  try {
    console.log('🌱 Seeding Act Amendments...');

    for (const item of actPolicyNotificationAmendmentData) {
      const exists = await prisma.actPolicyNotificationAmendment.findUnique({
        where: { id: item.id },
      });

      if (exists) {
        console.log(`⏭️ Skipped Amendment: ${item.id}`);
        continue;
      }

      await prisma.actPolicyNotificationAmendment.create({
        data: {
          id: item.id,
          actpolicynotification_id: item.actpolicynotification_id,
          level: item.level,
          name: item.name,
          brief: item.brief,
          englishfilePath: item.englishfilePath,
          hindifilePath: item.hindifilePath,
          isActive: item.isActive,
          user_agent: item.user_agent,
          ipaddress: item.ipaddress,
          start_date: item.start_date,
          end_date: item.end_date,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
      });

      console.log(`✔️ Inserted Amendment: ${item.id}`);
    }

    console.log('✅ Amendments seeding completed.');
  } catch (error) {
    console.error('❌ Error seeding Amendments:', error);
  }
}
