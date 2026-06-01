import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const inspections = await (prisma as any).inspectionTransaction.findMany({
            include: { service: true, applicationSubmission: true }
        });
        console.log("Found", inspections.length, "inspections.");

        inspections.forEach(insp => {
            console.log(`Insp ID: ${insp.id}, AppSubDept: ${insp.applicationSubmission?.deptId}, ServiceID: ${insp.serviceId}, ServiceDept: ${insp.service?.department_id}`);
        });

        // We want Labour inspections (where ApplicationSubmission has deptId = 9) 
        // to point to a service that belongs to department_id = 9.

        // Find a service that belongs to Labour (department_id = 9)
        const labourService = await (prisma as any).service.findFirst({
            where: { department_id: 9 }
        });

        if (labourService) {
            console.log(`Found Labour service: ${labourService.id} - ${labourService.service_name}`);

            // Assign this service to all inspections whose application submission has deptId = 9
            const updated = await (prisma as any).inspectionTransaction.updateMany({
                where: { applicationSubmission: { deptId: 9 } },
                data: { serviceId: labourService.id }
            });

            console.log(`Updated ${updated.count} inspections to Labour service (${labourService.id}).`);
        } else {
            console.log("No service found for Labour department (dept_id = 9).");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
