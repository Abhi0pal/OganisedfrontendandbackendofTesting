import { PrismaClient } from '@prisma/client';
import { seedKya } from './kya.seed';

const prisma = new PrismaClient();

seedKya(prisma)
    .then(() => {
        console.log('Done!');
        return prisma.$disconnect();
    })
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
