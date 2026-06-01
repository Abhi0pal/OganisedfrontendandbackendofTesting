import { PrismaClient } from '@prisma/client';

/**
 * Seeds KYA Categories, Questions, Options, Service Mappings, and Service Details.
 * This must run AFTER services are seeded (seedServices).
 */
export async function seedKyaData(prisma: PrismaClient) {
    console.log('\n🎯 Seeding KYA Data (Categories, Questions, Options, Service Mappings)...');

    // ── Step 1: Seed Categories ──────────────────────────────────────
    const categoryNames = [
        'Project related',
        'Sector',
        'Land and building Details',
        'Environment Related',
        'Utility Details',
        'Employment Details',
        'Other conditional Approvals',
    ];

    const categoryMap: Record<string, number> = {};

    for (const name of categoryNames) {
        const cat = await prisma.kyaCategory.upsert({
            where: { id: 0 }, // will always insert since id=0 doesn't exist
            create: { categoryName: name, isActive: true },
            update: {},
        }).catch(async () => {
            // If upsert fails, try findFirst or create
            const existing = await prisma.kyaCategory.findFirst({
                where: { categoryName: name },
            });
            if (existing) return existing;
            return prisma.kyaCategory.create({
                data: { categoryName: name, isActive: true },
            });
        });
        categoryMap[name] = cat.id;
    }
    console.log(`  ✓ Seeded ${categoryNames.length} KYA Categories`);

    // ── Step 2: Fetch some real services to map to ────────────────────
    const services = await prisma.service.findMany({
        where: { isActive: true },
        take: 30,
        orderBy: { id: 'asc' },
        select: { id: true, service_id: true, service_name: true, service_level: true, department_id: true },
    });

    if (services.length === 0) {
        console.warn('  ⚠️  No services found. Cannot create service mappings. Skipping KYA question seeding.');
        return;
    }

    console.log(`  ✓ Found ${services.length} services to map`);

    // ── Step 3: Create questions, options, and mappings ──────────────────

    // Helper to create a question with options and map each option to services
    async function createQuestionWithMapping(params: {
        categoryName: string;
        questionLabel: string;
        fieldType: 'Dropdown' | 'Text' | 'Radio';
        isMandatory?: boolean;
        isDependent?: boolean;
        parentQuestionId?: number;
        kyaOptionId?: number;
        tooltipText?: string;
        options?: Array<{
            label: string;
            serviceIndices: number[]; // indices into the services array
        }>;
    }) {
        const catId = categoryMap[params.categoryName];
        if (!catId) {
            console.warn(`  ⚠️ Category "${params.categoryName}" not found, skipping question.`);
            return null;
        }

        const question = await prisma.kyaQuestion.create({
            data: {
                categoryId: catId,
                questionLabel: params.questionLabel,
                fieldType: params.fieldType,
                isMandatory: params.isMandatory ?? true,
                isDependent: params.isDependent ?? false,
                parentQuestionId: params.parentQuestionId ?? null,
                kyaOptionId: params.kyaOptionId ?? null,
                isTooltipAvailable: !!params.tooltipText,
                tooltipText: params.tooltipText || null,
                showReferenceDocument: false,
                isActive: true,
            },
        });

        if (params.options && params.options.length > 0) {
            for (const opt of params.options) {
                const option = await prisma.kyaOption.create({
                    data: {
                        questionId: question.id,
                        optionLabel: opt.label,
                        isActive: true,
                    },
                });

                // Map option to services
                for (const idx of opt.serviceIndices) {
                    if (idx < services.length) {
                        await prisma.kyaServiceMapping.create({
                            data: {
                                optionId: option.id,
                                serviceId: services[idx].id,
                                isActive: true,
                            },
                        }).catch(() => {
                            // Ignore duplicate mapping errors
                        });
                    }
                }
            }
        }

        return question;
    }

    // ────────────────────────────────────────────────────────────────
    // CATEGORY 1: Project Related
    // ────────────────────────────────────────────────────────────────

    const q1 = await createQuestionWithMapping({
        categoryName: 'Project related',
        questionLabel: 'Where shall the proposed Enterprise intend to be setup?',
        fieldType: 'Dropdown',
        tooltipText: 'Select the state where you plan to set up your business.',
        options: [
            { label: 'Uttarakhand', serviceIndices: [0, 1, 2] },
            { label: 'Other State', serviceIndices: [3] },
        ],
    });

    const q2 = await createQuestionWithMapping({
        categoryName: 'Project related',
        questionLabel: 'What is the type of entity?',
        fieldType: 'Dropdown',
        tooltipText: 'Select your business entity type.',
        options: [
            { label: 'Proprietorship', serviceIndices: [0, 4, 5] },
            { label: 'Partnership', serviceIndices: [0, 4, 6] },
            { label: 'LLP', serviceIndices: [0, 4, 7] },
            { label: 'Private Limited Company', serviceIndices: [0, 4, 8, 9] },
            { label: 'Public Limited Company', serviceIndices: [0, 4, 8, 9, 10] },
            { label: 'Co-operative Society', serviceIndices: [0, 4, 11] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Project related',
        questionLabel: 'What is the size of the proposed enterprise?',
        fieldType: 'Dropdown',
        tooltipText: 'MSME classification based on investment and turnover.',
        options: [
            { label: 'Micro (Investment ≤ 1 Cr & Turnover ≤ 5 Cr)', serviceIndices: [0, 1] },
            { label: 'Small (Investment ≤ 10 Cr & Turnover ≤ 50 Cr)', serviceIndices: [0, 1, 2] },
            { label: 'Medium (Investment ≤ 50 Cr & Turnover ≤ 250 Cr)', serviceIndices: [0, 1, 2, 3] },
            { label: 'Large (Investment > 50 Cr)', serviceIndices: [0, 1, 2, 3, 4] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Project related',
        questionLabel: 'What is the type of proposal?',
        fieldType: 'Dropdown',
        options: [
            { label: 'New Project', serviceIndices: [0, 1, 2, 5] },
            { label: 'Expansion', serviceIndices: [0, 6, 7] },
            { label: 'Diversification', serviceIndices: [0, 8] },
            { label: 'Modernization', serviceIndices: [0, 9] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Project related',
        questionLabel: 'Select District',
        fieldType: 'Dropdown',
        tooltipText: 'Select the district where the enterprise will be located.',
        options: [
            { label: 'Dehradun', serviceIndices: [0, 1, 2] },
            { label: 'Haridwar', serviceIndices: [0, 1, 3] },
            { label: 'Udham Singh Nagar', serviceIndices: [0, 1, 4] },
            { label: 'Nainital', serviceIndices: [0, 1, 5] },
            { label: 'Others', serviceIndices: [0, 1] },
        ],
    });

    // ────────────────────────────────────────────────────────────────
    // CATEGORY 2: Sector
    // ────────────────────────────────────────────────────────────────

    await createQuestionWithMapping({
        categoryName: 'Sector',
        questionLabel: 'What is the sector type?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Manufacturing', serviceIndices: [0, 1, 2, 3, 10, 11] },
            { label: 'Services', serviceIndices: [0, 1, 4, 5] },
            { label: 'Food and Civil Safety', serviceIndices: [0, 12, 13, 14] },
            { label: 'IT/ITES', serviceIndices: [0, 5, 6] },
            { label: 'Pharmaceutical', serviceIndices: [0, 7, 8, 15] },
            { label: 'Tourism & Hospitality', serviceIndices: [0, 9, 16] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Sector',
        questionLabel: 'Provide further details about the sector',
        fieldType: 'Text',
    });

    // ────────────────────────────────────────────────────────────────
    // CATEGORY 3: Land and Building Details
    // ────────────────────────────────────────────────────────────────

    const q3_1 = await createQuestionWithMapping({
        categoryName: 'Land and building Details',
        questionLabel: 'Does the establishment use any Weights & Measure instruments?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 1, 10] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Land and building Details',
        questionLabel: 'Does the establishment involve import/export activities?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 2, 11, 12] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Land and building Details',
        questionLabel: 'Do you have land in possession?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes – Own Land', serviceIndices: [0, 3] },
            { label: 'Yes – Leased Land', serviceIndices: [0, 3, 13] },
            { label: 'No – Looking for land', serviceIndices: [0, 14] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Land and building Details',
        questionLabel: 'Is tree felling required on the land?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 4, 15] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Land and building Details',
        questionLabel: 'What is the height of the building?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Up to 15 meters', serviceIndices: [0] },
            { label: '15 – 30 meters', serviceIndices: [0, 5] },
            { label: 'Above 30 meters', serviceIndices: [0, 5, 16] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Land and building Details',
        questionLabel: 'Total area of land (in acres)',
        fieldType: 'Text',
    });

    // ────────────────────────────────────────────────────────────────
    // CATEGORY 4: Environment Related
    // ────────────────────────────────────────────────────────────────

    await createQuestionWithMapping({
        categoryName: 'Environment Related',
        questionLabel: 'What is the pollution category of the industry?',
        fieldType: 'Dropdown',
        tooltipText: 'Based on CPCB classification – Red, Orange, Green, or White.',
        options: [
            { label: 'Red', serviceIndices: [0, 1, 2, 3, 17, 18] },
            { label: 'Orange', serviceIndices: [0, 1, 2, 17] },
            { label: 'Green', serviceIndices: [0, 1] },
            { label: 'White', serviceIndices: [0] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Environment Related',
        questionLabel: 'Does the unit deal with Hazardous Waste?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 6, 19] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Environment Related',
        questionLabel: 'Does the unit generate E-Waste?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 7, 20] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Environment Related',
        questionLabel: 'Does the unit manufacture or deal with Plastic products?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 8, 21] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    // ────────────────────────────────────────────────────────────────
    // CATEGORY 5: Utility Details
    // ────────────────────────────────────────────────────────────────

    await createQuestionWithMapping({
        categoryName: 'Utility Details',
        questionLabel: 'Does the establishment require a lift/elevator?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 9, 22] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Utility Details',
        questionLabel: 'Does the establishment use/store petroleum products?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 10, 23] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Utility Details',
        questionLabel: 'What is the required power load (in KW)?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Up to 50 KW', serviceIndices: [0] },
            { label: '50 – 500 KW', serviceIndices: [0, 11] },
            { label: '500 KW – 1 MW', serviceIndices: [0, 11, 24] },
            { label: 'Above 1 MW', serviceIndices: [0, 11, 24, 25] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Utility Details',
        questionLabel: 'Does the establishment use a DG Set / Generator?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 12, 26] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Utility Details',
        questionLabel: 'Is road cutting required for the project?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 13, 27] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Utility Details',
        questionLabel: 'Does the establishment use a Boiler?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 14, 28] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Utility Details',
        questionLabel: 'What is the primary water source?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Municipal Supply', serviceIndices: [0] },
            { label: 'Borewell / Tubewell', serviceIndices: [0, 15, 29] },
            { label: 'River / Canal', serviceIndices: [0, 16] },
            { label: 'Rain Water Harvesting', serviceIndices: [0] },
        ],
    });

    // ────────────────────────────────────────────────────────────────
    // CATEGORY 6: Employment Details
    // ────────────────────────────────────────────────────────────────

    await createQuestionWithMapping({
        categoryName: 'Employment Details',
        questionLabel: 'Expected total number of employees',
        fieldType: 'Dropdown',
        options: [
            { label: 'Up to 10', serviceIndices: [0] },
            { label: '11 – 50', serviceIndices: [0, 1] },
            { label: '51 – 250', serviceIndices: [0, 1, 2, 17] },
            { label: 'Above 250', serviceIndices: [0, 1, 2, 3, 17, 18] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Employment Details',
        questionLabel: 'Will the enterprise employ contract labour?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 4, 19] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Employment Details',
        questionLabel: 'Will the enterprise employ interstate migrant workers?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 5, 20] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    // ────────────────────────────────────────────────────────────────
    // CATEGORY 7: Other conditional Approvals
    // ────────────────────────────────────────────────────────────────

    await createQuestionWithMapping({
        categoryName: 'Other conditional Approvals',
        questionLabel: 'Does the establishment display any signage or advertisement?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 6, 21] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Other conditional Approvals',
        questionLabel: 'Does the establishment require a telecom tower installation?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes', serviceIndices: [0, 7, 22] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    await createQuestionWithMapping({
        categoryName: 'Other conditional Approvals',
        questionLabel: 'Is the business related to food processing or drug manufacturing?',
        fieldType: 'Dropdown',
        options: [
            { label: 'Yes – Food processing', serviceIndices: [0, 8, 23, 24] },
            { label: 'Yes – Drug manufacturing', serviceIndices: [0, 9, 25, 26] },
            { label: 'No', serviceIndices: [] },
        ],
    });

    // ── Step 4: Create Service Details for the mapped services ─────────
    console.log('  🏢 Creating service details for mapped services...');

    const serviceCategories = [
        'Pre Establishment',
        'Pre Operation',
        'Post Operation',
    ];

    let detailCount = 0;
    for (let i = 0; i < Math.min(services.length, 20); i++) {
        const svc = services[i];
        if (!svc.service_id) continue;

        // Check if service detail already exists
        const existing = await prisma.serviceDetail.findUnique({
            where: { serviceId: svc.service_id },
        });

        if (existing) continue;

        // Create service detail with varied dummy data
        const catIdx = i % serviceCategories.length;
        const timeline = [7, 15, 30, 45, 60, 90][i % 6];

        await prisma.serviceDetail.create({
            data: {
                serviceId: svc.service_id,
                serviceCategory: serviceCategories[catIdx],
                authorityName: getDummyAuthority(i),
                timeline: timeline,
                sopDocument: null,
                feeStructureDocument: null,
                listOfRequiredDocuments: null,
                isActive: true,
            },
        });
        detailCount++;
    }

    console.log(`  ✓ Created ${detailCount} service details`);
    console.log('✅ KYA Data seeding completed successfully.');
}

function getDummyAuthority(index: number): string {
    const authorities = [
        'District Industries Centre (DIC)',
        'Uttarakhand Pollution Control Board (UPCB)',
        'Department of Labour',
        'Fire Safety Department',
        'Town & Country Planning Department',
        'Uttarakhand Power Corporation (UPCL)',
        'PWD – Public Works Department',
        'Food Safety and Standards Authority (FSSAI)',
        'Drug Controller, Uttarakhand',
        'Department of Industries',
        'Chief Inspector of Factories',
        'Weights & Measures Department',
        'Directorate General of Foreign Trade (DGFT)',
        'Revenue Department',
        'SIDCUL (State Industrial Development Corporation)',
        'Forest Department, Uttarakhand',
        'Municipal Corporation / Nagar Palika',
        'State Pollution Control Board',
        'Central Pollution Control Board (CPCB)',
        'Ministry of Environment, Forest and Climate Change',
    ];
    return authorities[index % authorities.length];
}
