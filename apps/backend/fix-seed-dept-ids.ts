import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Updating department_users from dept_id 1 to 9...");
        const deptUsers = await prisma.department_users.updateMany({
            where: { dept_id: 1, full_name: { not: 'Directorate of Industries' } },
            // the original seeded users were likely dept_id: 1, let's just update those seeded in cis-inspections
            // actually, we should just update the inspectors seeded in cis-inspections.seed.ts
            data: { dept_id: 9 }
        });
        console.log(`Updated ${deptUsers.count} department users.`);

        console.log("Updating ApplicationSubmissions from deptId 1 to 9...");
        const submissions = await prisma.applicationSubmission.updateMany({
            where: { deptId: 1 },
            data: { deptId: 9 }
        });
        console.log(`Updated ${submissions.count} submissions.`);

    } catch (error) {
        console.error("Error updating records:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
