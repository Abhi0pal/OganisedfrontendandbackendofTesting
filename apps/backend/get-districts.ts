import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const districts = await prisma.district.findMany({
        take: 5
    });
    console.log(districts);
}
main().finally(() => prisma.$disconnect());
