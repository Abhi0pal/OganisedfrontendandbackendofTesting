import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIds() {
    console.log('Checking if IDs start from 1...\n');

    const roles = await prisma.roles.findFirst({ orderBy: { id: 'asc' } });
    const resources = await prisma.resources.findFirst({ orderBy: { id: 'asc' } });
    const countries = await prisma.country.findFirst({ orderBy: { id: 'asc' } });
    const states = await prisma.state.findFirst({ orderBy: { id: 'asc' } });
    const districts = await prisma.district.findFirst({ orderBy: { id: 'asc' } });
    const users = await prisma.users.findFirst({ orderBy: { id: 'asc' } });

    console.log(`✓ roles: first ID = ${roles?.id || 'N/A'}`);
    console.log(`✓ resources: first ID = ${resources?.id || 'N/A'}`);
    console.log(`✓ countries: first ID = ${countries?.id || 'N/A'}`);
    console.log(`✓ states: first ID = ${states?.id || 'N/A'}`);
    console.log(`✓ districts: first ID = ${districts?.id || 'N/A'}`);
    console.log(`✓ users: first ID = ${users?.id || 'N/A'}`);

    await prisma.$disconnect();
}

checkIds().catch((e) => {
    console.error(e);
    process.exit(1);
});
