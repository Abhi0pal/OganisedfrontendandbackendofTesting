import { PrismaClient } from '@prisma/client';
import { actPolicyNotificationDepartmentData } from './data/act-policy-notification-department.data';

export async function seedActPolicyNotificationDepartments(prisma: PrismaClient) {
  try {
    console.log('🌱 Seeding Act–Department mapping...');

    for (const item of actPolicyNotificationDepartmentData) {
      const exists = await prisma.actPolicyNotificationDepartment.findUnique({
        where: {
          actpolicynotification_id_department_id: {
            actpolicynotification_id: item.actpolicynotification_id,
            department_id: item.department_id,
          },
        },
      });

      if (exists) {
        console.log(`⏭️ Skipped mapping Act ${item.actpolicynotification_id} → Dept ${item.department_id}`);
        continue;
      }

      await prisma.actPolicyNotificationDepartment.create({
        data: item,
      });

      console.log(`✔️ Linked Act ${item.actpolicynotification_id} → Dept ${item.department_id}`);
    }

    console.log('✅ Act–Department mapping completed.');
  } catch (error) {
    console.error('❌ Error seeding Act–Department mapping:', error);
  }
}
