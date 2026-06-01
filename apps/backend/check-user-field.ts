import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.users.findFirst({
        where: { email: 'spcb@example.com', tenant_id: 8 },
        select: { id: true, email: true, role_id: true }
    });
    
    if (user) {
        console.log({
            id: user.id.toString(),
            email: user.email,
            role_id: user.role_id
        });
    } else {
        console.log('User not found');
    }
}

main().finally(() => prisma.$disconnect());
