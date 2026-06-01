//import { PrismaClient } from '@prisma/client';
import { PrismaClient, ActPolicyNotificationType} from '@prisma/client';
import { actPolicyNotificationData } from './data/act-policy-notification.data';

export async function seedActPolicyNotifications(prisma: PrismaClient) {
  try {
    console.log('Seeding Act Policy Notification...');
    for (const item of actPolicyNotificationData) {
      const exists = await prisma.actPolicyNotification.findUnique({
        where: { id: item.id },
      });
    
      if (exists) continue;
      // check department existence
      
      if (!exists) {
        await prisma.actPolicyNotification.create({
          data: {
            id: item.id,
            type: item.type ? item.type as ActPolicyNotificationType : ActPolicyNotificationType.Act,
            level: item.level,
            name: item.name,
            brief: item.brief,
            englishfilePath: item.englishfilePath,
            hindifilePath: item.hindifilePath,
            isActive: item.isActive,
            user_agent: item.user_agent,
            ipaddress: item.ipaddress,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
        });

        console.log(`✔️ Inserted: ${item.id}`);
      } else {
        console.log(`⏭️ Skipped (already exists): ${item.id}`);
      }

    }

    console.log('Act Policy Notifications seeding completed.');
  } catch (error) {
    console.error('Error seeding Act Policy Notifications:', error);
  }
}
