import { PrismaClient } from '@prisma/client';
import { seedCISInspections } from './prisma/seeds/cis-inspections.seed';

const prisma = new PrismaClient();

async function runSingleSeed() {
    console.log('Running only seedCISInspections...');
    await seedCISInspections(prisma);
    console.log('Done.');
    await prisma.$disconnect();
}

runSingleSeed().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
