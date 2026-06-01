import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.users.findFirst({ where: { email: 'dept.labour@example.com' } });
    console.log(user);
    const users = await prisma.users.findMany({ select: { email: true, password_hash: true } });
    console.log("All users:", users.map(u => u.email).join(', '));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
