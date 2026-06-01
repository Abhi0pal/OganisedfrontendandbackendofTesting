import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SWS Annexure 9 Inspection Checklists Seeder
 * 
 * This seeds hardcoded inspection checklists based on SWS Annexure 9 requirements.
 * Each checklist is linked to a specific service type.
 */

interface ChecklistTemplate {
    serviceName: string;
    serviceId?: number; // Will be looked up
    version: string;
    items: {
        title: string;
        description?: string;
        type: string; // PHOTO, VIDEO, DOCUMENT, TEXT, NUMERIC
        isMandatory: boolean;
        riskIndicator?: string; // HIGH, MEDIUM, LOW
        validationRules?: Record<string, any>;
    }[];
}

const annexure9Templates: ChecklistTemplate[] = [
    // ===================================
    // LABOUR MODULE
    // ===================================
    {
        serviceName: 'Labour Compliance',
        version: '1.0',
        items: [
            {
                title: 'Equal Remuneration Act - Wage Rates Verification',
                description: 'Verify that wage rates comply with Equal Remuneration Act requirements',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Contract Labour Act - Muster Rolls Available',
                description: 'Check availability of muster rolls for contract labourers',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Contract Labour Act - Wage Slips Distribution',
                description: 'Verify wage slips are being distributed to contract workers',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
            {
                title: 'Minimum Wages Act - Display Notices',
                description: 'Check if minimum wage notices are prominently displayed',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
            {
                title: 'Payment of Gratuity Act - Notice of Opening',
                description: 'Verify notice of opening under Gratuity Act is filed',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'LOW',
            },
            {
                title: 'ESI & PF Registration Status',
                description: 'Verify ESI and PF registration certificates',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Safety Equipment Availability',
                description: 'Check availability and condition of safety equipment',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
        ],
    },

    // ===================================
    // LEGAL METROLOGY
    // ===================================
    {
        serviceName: 'Legal Metrology',
        version: '1.0',
        items: [
            {
                title: 'Registration under Legal Metrology Act 2009',
                description: 'Verify valid registration certificate under Legal Metrology Act',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Partnership Deed / Company Registration',
                description: 'Verify partnership deed or company registration documents',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
            {
                title: 'Model Approval Certificates',
                description: 'Check model approval certificates for weighing instruments',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Security Deposit (NSC) Copies',
                description: 'Verify NSC copies for security deposit are available',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
            {
                title: 'Weighing Instrument Verification Stamps',
                description: 'Check if all weighing instruments have valid verification stamps',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Calibration Certificates',
                description: 'Verify current calibration certificates for all measuring devices',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
        ],
    },

    // ===================================
    // POLLUTION (CTE/CTO)
    // ===================================
    {
        serviceName: 'Pollution Control',
        version: '1.0',
        items: [
            {
                title: 'Flow Meter Reading - Effluent Discharge',
                description: 'Record current flow meter reading for effluent discharge',
                type: 'NUMERIC',
                isMandatory: true,
                riskIndicator: 'HIGH',
                validationRules: { unit: 'KLD', min: 0, max: 10000 },
            },
            {
                title: 'Flow Meter Reading - Water Intake',
                description: 'Record current flow meter reading for water intake',
                type: 'NUMERIC',
                isMandatory: true,
                riskIndicator: 'HIGH',
                validationRules: { unit: 'KLD', min: 0, max: 10000 },
            },
            {
                title: 'Effluent Generation Sources Mapping',
                description: 'Document all sources of effluent generation in the facility',
                type: 'TEXT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Effluent Treatment Plant (ETP) Operation Status',
                description: 'Verify ETP is operational and record capacity utilization',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Air Pollution Control Systems Status',
                description: 'Verify air pollution control systems are functioning properly',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Stack Emission Monitoring Records',
                description: 'Review stack emission monitoring records for compliance',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Hazardous Waste Storage Details',
                description: 'Verify hazardous waste storage area and authorization',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Hazardous Waste Manifest Records',
                description: 'Review hazardous waste manifest and disposal records',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Consent to Operate (CTO) Display',
                description: 'Verify valid CTO is displayed at the facility',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
            {
                title: 'Environmental Clearance Certificate',
                description: 'Verify Environmental Clearance certificate if applicable',
                type: 'DOCUMENT',
                isMandatory: false,
                riskIndicator: 'HIGH',
            },
        ],
    },

    // ===================================
    // FIRE SAFETY
    // ===================================
    {
        serviceName: 'Fire Safety',
        version: '1.0',
        items: [
            {
                title: 'Fire NOC Display',
                description: 'Verify Fire NOC is displayed prominently',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Fire Extinguisher Locations',
                description: 'Check fire extinguisher placement as per approved plan',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Fire Extinguisher Expiry Check',
                description: 'Verify all fire extinguishers are within validity period',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Emergency Exit Routes',
                description: 'Verify emergency exit routes are clear and marked',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Fire Alarm System Functionality',
                description: 'Test fire alarm system is functional',
                type: 'VIDEO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Sprinkler System Status',
                description: 'Check sprinkler system installation and functionality',
                type: 'PHOTO',
                isMandatory: false,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Fire Drill Records',
                description: 'Review fire drill records for the last 12 months',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
            {
                title: 'Emergency Assembly Point',
                description: 'Verify emergency assembly point is marked',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
        ],
    },

    // ===================================
    // BUILDING PLAN APPROVAL
    // ===================================
    {
        serviceName: 'Building Plan Approval',
        version: '1.0',
        items: [
            {
                title: 'Approved Building Plan Match',
                description: 'Verify construction matches approved building plan',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Setback Compliance',
                description: 'Measure and verify setback distances as per approved plan',
                type: 'NUMERIC',
                isMandatory: true,
                riskIndicator: 'HIGH',
                validationRules: { unit: 'meters', min: 0, max: 100 },
            },
            {
                title: 'Floor Area Ratio (FAR) Compliance',
                description: 'Verify FAR is within permissible limits',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
            {
                title: 'Parking Space Provision',
                description: 'Check parking provision as per approved plan',
                type: 'PHOTO',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
            },
            {
                title: 'Building Height Verification',
                description: 'Verify building height matches approved plan',
                type: 'NUMERIC',
                isMandatory: true,
                riskIndicator: 'HIGH',
                validationRules: { unit: 'meters', min: 0, max: 500 },
            },
            {
                title: 'Structural Stability Certificate',
                description: 'Verify structural stability certificate from approved engineer',
                type: 'DOCUMENT',
                isMandatory: true,
                riskIndicator: 'HIGH',
            },
        ],
    },
];

async function seedAnnexure9Checklists() {
    console.log('🌱 Seeding Annexure 9 Inspection Checklists...\n');

    for (const template of annexure9Templates) {
        // Try to find a matching service by name
        const service = await (prisma as any).service.findFirst({
            where: {
                OR: [
                    { service_name: { contains: template.serviceName, mode: 'insensitive' } },
                    { service_name: { contains: template.serviceName.split(' ')[0], mode: 'insensitive' } },
                ],
                isActive: true,
            },
        });

        if (!service) {
            console.log(`⚠️  No service found for "${template.serviceName}" - Skipping`);
            continue;
        }

        // Check if checklist already exists for this service and version
        const existingChecklist = await (prisma as any).inspectionChecklist.findFirst({
            where: {
                serviceId: service.id,
                version: template.version,
            },
        });

        if (existingChecklist) {
            console.log(`ℹ️  Checklist for "${service.service_name}" v${template.version} already exists - Skipping`);
            continue;
        }

        // Create the checklist with items
        const checklist = await (prisma as any).inspectionChecklist.create({
            data: {
                serviceId: service.id,
                version: template.version,
                isActive: true,
                items: {
                    create: template.items.map((item) => ({
                        title: item.title,
                        description: item.description || null,
                        type: item.type,
                        isMandatory: item.isMandatory,
                        riskIndicator: item.riskIndicator || null,
                        validationRules: item.validationRules || null,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        console.log(`✅ Created checklist for "${service.service_name}" with ${checklist.items.length} items`);
    }

    console.log('\n✅ Annexure 9 Inspection Checklists seeding complete!');
}

// Run if executed directly
seedAnnexure9Checklists()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

export { seedAnnexure9Checklists, annexure9Templates };
