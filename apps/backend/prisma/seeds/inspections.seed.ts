import { PrismaClient } from '@prisma/client';

interface ServiceData {
    id: number;
    service_name: string;
}

interface ChecklistData {
    id: number;
    serviceId: number;
    version: string;
    items: any[];
}

interface InspectionData {
    id: string;
    status: string;
}

export async function seedInspections(prisma: PrismaClient) {
    console.log('  📋 Seeding Inspection data...');

    // First, check if we have services and create checklists
    const services: ServiceData[] = await (prisma as any).service.findMany({
        take: 3,
        where: { department_id: 1 },
        select: { id: true, service_name: true },
    });

    if (services.length === 0) {
        console.log('    ⚠️ No services found, skipping inspection seed');
        return;
    }

    // Create Inspection Checklists
    const checklists: ChecklistData[] = [];
    for (const service of services) {
        const checklist = await (prisma as any).inspectionChecklist.upsert({
            where: {
                serviceId_version: {
                    serviceId: service.id,
                    version: '1.0',
                },
            },
            update: {},
            create: {
                serviceId: service.id,
                version: '1.0',
                isActive: true,
                items: {
                    create: [
                        {
                            title: 'Document verification completed',
                            type: 'checkbox',
                            isMandatory: true,
                            riskIndicator: 'LOW',
                        },
                        {
                            title: 'Site photographs captured',
                            type: 'photo',
                            isMandatory: true,
                            riskIndicator: 'MED',
                        },
                        {
                            title: 'Safety equipment present and functional',
                            type: 'checkbox',
                            isMandatory: true,
                            riskIndicator: 'HIGH',
                        },
                        {
                            title: 'Compliance certificate valid',
                            type: 'file',
                            isMandatory: true,
                            riskIndicator: 'HIGH',
                        },
                        {
                            title: 'Additional remarks',
                            type: 'text',
                            isMandatory: false,
                            riskIndicator: 'LOW',
                        },
                    ],
                },
            },
            include: {
                items: true,
            },
        });
        checklists.push(checklist as ChecklistData);
        console.log(`    ✓ Checklist for ${service.service_name} created`);
    }

    // Create sample Inspection Transactions
    const inspectionsData = [
        {
            applicationId: 'APP-2024-001',
            serviceId: services[0].id,
            checklistId: checklists[0].id,
            status: 'SCHEDULED',
            scheduledDate: new Date('2024-02-20'),
            inspectorType: 'DEPARTMENT_OFFICIAL',
        },
        {
            applicationId: 'APP-2024-002',
            serviceId: services[1]?.id || services[0].id,
            checklistId: checklists[1]?.id || checklists[0].id,
            status: 'APPLICANT_RESPONSE_PENDING',
            scheduledDate: new Date('2024-02-15'),
            inspectionDate: new Date('2024-02-15'),
            inspectorType: 'DEPARTMENT_OFFICIAL',
        },
        {
            applicationId: 'APP-2024-003',
            serviceId: services[2]?.id || services[0].id,
            checklistId: checklists[2]?.id || checklists[0].id,
            status: 'REPORT_PUBLISHED',
            scheduledDate: new Date('2024-02-10'),
            inspectionDate: new Date('2024-02-10'),
            reportPublishedAt: new Date('2024-02-12'),
            inspectorType: 'THIRD_PARTY',
        },
        {
            applicationId: 'APP-2024-004',
            serviceId: services[0].id,
            checklistId: checklists[0].id,
            status: 'IN_PROGRESS',
            scheduledDate: new Date('2024-02-25'),
            inspectorType: 'DEPARTMENT_OFFICIAL',
        },
        // JD Portal Test Data
        {
            applicationId: 'APP-2024-005',
            serviceId: services[0].id,
            checklistId: checklists[0].id,
            status: 'PENDING_ALLOCATION',
            scheduledDate: new Date('2024-03-01'), // Future date, but needs allocation
            inspectorType: 'DEPARTMENT_OFFICIAL',
            priority: 'HIGH',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (Urgent)
        },
        {
            applicationId: 'APP-2024-006',
            serviceId: services[1]?.id || services[0].id,
            checklistId: checklists[1]?.id || checklists[0].id,
            status: 'PENDING_ALLOCATION',
            scheduledDate: new Date('2024-03-05'),
            inspectorType: 'DEPARTMENT_OFFICIAL',
            priority: 'NORMAL',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
            applicationId: 'APP-2024-007',
            serviceId: services[0].id,
            checklistId: checklists[0].id,
            status: 'PENDING_ALLOCATION',
            scheduledDate: new Date('2024-03-02'),
            inspectorType: 'DEPARTMENT_OFFICIAL',
            priority: 'NORMAL',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (Very Urgent)
        },
    ];

    const createdInspections: InspectionData[] = [];
    for (const data of inspectionsData) {
        const inspection = await (prisma as any).inspectionTransaction.create({
            data,
        });
        createdInspections.push(inspection as InspectionData);
        console.log(`    ✓ Inspection ${(inspection.id as string).slice(0, 8)}... created (${data.status})`);
    }

    // Add observations for the pending inspection
    const pendingInspection = createdInspections.find((i: InspectionData) => i.status === 'APPLICANT_RESPONSE_PENDING');
    if (pendingInspection) {
        const observations = [
            {
                inspectionId: pendingInspection.id,
                observationText: 'Fire extinguisher was found expired. Last valid date was January 2024. Immediate replacement required.',
                severity: 'MAJOR',
                status: 'OPEN',
                evidenceUrl: [],
            },
            {
                inspectionId: pendingInspection.id,
                observationText: 'Emergency exit signage not clearly visible from main work area.',
                severity: 'MINOR',
                status: 'OPEN',
                evidenceUrl: [],
            },
            {
                inspectionId: pendingInspection.id,
                observationText: 'Safety training records were not updated for Q4 2023.',
                severity: 'MINOR',
                status: 'RESOLVED',
                evidenceUrl: [],
            },
        ];

        for (const obs of observations) {
            await (prisma as any).inspectionObservation.create({
                data: obs,
            });
        }
        console.log('    ✓ Observations added to pending inspection');
    }

    // Add observations for completed inspection
    const completedInspection = createdInspections.find((i: InspectionData) => i.status === 'REPORT_PUBLISHED');
    if (completedInspection) {
        const observation = await (prisma as any).inspectionObservation.create({
            data: {
                inspectionId: completedInspection.id,
                observationText: 'Minor documentation discrepancy found in compliance records.',
                severity: 'MINOR',
                status: 'CLOSED',
                evidenceUrl: [],
            },
        });

        // Add a response to the closed observation
        await (prisma as any).inspectionObservationResponse.create({
            data: {
                observationId: observation.id,
                responderId: BigInt(1), // Admin user
                message: 'Documentation has been corrected and re-submitted for review.',
                attachments: [],
                isInternal: false,
            },
        });
        console.log('    ✓ Observations and responses added to completed inspection');
    }

    console.log('  ✅ Inspection data seeded successfully');
}
