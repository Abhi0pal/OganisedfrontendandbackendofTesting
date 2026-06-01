import { PrismaClient } from '@prisma/client';
import { seedRoleResources } from './seeds/role-resources.seed';

const prisma = new PrismaClient();

seedRoleResources(prisma)
    .then(() => console.log('Role resources seeded.'))
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
