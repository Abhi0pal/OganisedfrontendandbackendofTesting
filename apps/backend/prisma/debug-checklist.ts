import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const inspectionId = '493c2b15-1105-4780-9f36-d3f6226876f9';
    // Usually UUID is the ID.
    const inspection = await prisma.inspectionTransaction.findUnique({
        where: { id: inspectionId },
        include: { checklist: { include: { items: true } } }
    });

    if (!inspection) {
        console.log('Inspection not found under ID (UUID). Checking applicationId...');
        const insp2 = await prisma.inspectionTransaction.findFirst({
            where: { applicationId: inspectionId },
            include: { checklist: { include: { items: true } } }
        });
        if (insp2) { show(insp2); return; }
        console.log('Inspection not found.');
        return;
    }

    show(inspection);
}

function show(val: any) {
    console.log('Inspection found:', val.id);
    if (val.checklist) {
        console.log('Checklist:', val.checklist.name, '(ID:', val.checklist.id, ')');
        console.log('Items:', val.checklist.items.length);
        val.checklist.items.forEach((item: any) => {
            console.log(`Item ${item.id}: Title="${item.title}", Type="${item.type}"`);
        });
    } else {
        console.log('No checklist linked.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
