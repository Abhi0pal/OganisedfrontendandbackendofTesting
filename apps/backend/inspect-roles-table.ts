import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'roles';
    `;
    console.log(JSON.stringify(columns, null, 2));
}

main().finally(() => prisma.$disconnect());
