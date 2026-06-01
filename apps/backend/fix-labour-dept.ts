import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'dept.labour@example.com';
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
        console.log(`User ${email} not found`);
        return;
    }

    const dept = await prisma.department.findFirst({ where: { boDeptId: 9 } });
    if (!dept) {
        console.log("Labour department (boDeptId 9) not found");
        return;
    }

    console.log(`Current user ID: ${user.id}, target dept ID: ${dept.id} (boDeptId: ${dept.boDeptId}, name: ${dept.name})`);

    const deptUser = await prisma.department_users.findFirst({ where: { user_id: user.id } });
    if (deptUser) {
        console.log(`Updating department for user ${email}...`);
        await prisma.department_users.update({
            where: { id: deptUser.id },
            data: { dept_id: dept.id }
        });
        console.log("Updated successfully.");
    } else {
        console.log(`Creating department link for user ${email}...`);
        await prisma.department_users.create({
            data: {
                user_id: user.id,
                dept_id: dept.id,
                status: 1,
                email: email,
                full_name: "Labour Department User"
            }
        });
        console.log("Created successfully.");
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
