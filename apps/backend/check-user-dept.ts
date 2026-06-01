import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.users.findFirst({ where: { email: 'dept.labour@example.com' } });
    if (user) {
        const deptUser = await prisma.department_users.findFirst({ where: { user_id: user.id } });
        console.log("Dept User Details:", deptUser);
    } else {
        console.log("User not found");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
