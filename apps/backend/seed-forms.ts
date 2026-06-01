import { PrismaClient, YnFlag } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICE_ID = '12267.0';
const TENANT_ID = 6;
const PROJECT_ID = 5;
const DEPARTMENT_ID = 16; 

const FORMS_TO_SEED = [
    {
        roleName: 'Project Monitoring Division',
        formTypeId: 2,
        formName: 'Project Monitoring Division Form',
        pageName: 'Department Form',
        categoryName: 'Department Form',
        customLabel: 'Monitoring Remarks',
        fieldType: 'textarea',
        fieldCode: 'AUTHORITY_COMMENT_FIELD',  // reuse existing
    }
];

async function main() {
    console.log('==========================================================');
    console.log(` SEEDING: Multiple Forms for Service (${SERVICE_ID})`);
    console.log('==========================================================\n');

    for (const config of FORMS_TO_SEED) {
        console.log(`\n▶ Processing Role: ${config.roleName}...`);

        // ── Step 1: Ensure Role Exists ─────────────────────────────────
        let role = await prisma.roles.findFirst({
            where: { name: config.roleName, tenant_id: TENANT_ID },
        });

        if (!role) {
            console.log(`  ❌ Role '${config.roleName}' not found for tenant ${TENANT_ID}. Skipping.`);
            continue;
        }

        // Fix any existing soft-deleted mappings to ensure they show up
        await prisma.formMapping.updateMany({
            where: {
                service_id: SERVICE_ID,
                form_type_id: config.formTypeId,
                tenant_id: TENANT_ID,
                project_id: PROJECT_ID,
                role_id: role.id,
                is_active: YnFlag.N
            },
            data: { is_active: YnFlag.Y }
        });

        // ── Step 2: Form Mapping ───────────────────────────────────────
        let mapping = await prisma.formMapping.findFirst({
            where: {
                service_id: SERVICE_ID,
                form_type_id: config.formTypeId,
                tenant_id: TENANT_ID,
                project_id: PROJECT_ID,
                role_id: role.id,
                is_active: YnFlag.Y
            }
        });

        if (!mapping) {
            mapping = await prisma.formMapping.create({
                data: {
                    department_id: DEPARTMENT_ID,
                    service_id: SERVICE_ID,
                    form_type_id: config.formTypeId,
                    form_name: config.formName,
                    form_code: config.roleName.replace(/\s+/g, '_').toUpperCase() + '_FORM',
                    is_active: YnFlag.Y,
                    tenant_id: TENANT_ID,
                    project_id: PROJECT_ID,
                    role_id: role.id,
                    created: new Date(),
                    modified: new Date()
                }
            });
            console.log(`  ✅ Created Form Mapping: ${config.formName} (ID: ${mapping.id})`);
        } else {
            console.log(`  ⏭️ Form Mapping already exists: ${config.formName} (ID: ${mapping.id})`);
        }

        // ── Step 3: Page Master ────────────────────────────────────────
        let page = await prisma.formPageMaster.findFirst({
            where: {
                service_id: SERVICE_ID,
                form_id: config.formTypeId,
                tenantId: TENANT_ID,
                projectId: PROJECT_ID,
                role_id: role.id,
                page_name: config.pageName,
                is_active: YnFlag.Y
            }
        });

        if (!page) {
            page = await prisma.formPageMaster.create({
                data: {
                    service_id: SERVICE_ID,
                    form_id: config.formTypeId,
                    page_name: config.pageName,
                    preference: 1,
                    is_active: YnFlag.Y,
                    tenantId: TENANT_ID,
                    projectId: PROJECT_ID,
                    role_id: role.id,
                    created: new Date(),
                    modified: new Date()
                }
            });
            console.log(`  ✅ Created Page: ${config.pageName} (ID: ${page.id})`);
        } else {
            console.log(`  ⏭️ Page already exists: ${config.pageName} (ID: ${page.id})`);
        }

        // ── Step 4: Category Master ────────────────────────────────────
        const categoryCode = config.categoryName.toUpperCase().replace(/\s+/g, '_') + '_CAT';
        let category = await prisma.formCategory.findFirst({
            where: { categoryName: config.categoryName }
        });

        if (!category) {
            category = await prisma.formCategory.create({
                data: {
                    categoryName: config.categoryName,
                    categoryCode: categoryCode,
                    tenantId: TENANT_ID,
                    projectId: PROJECT_ID,
                    isActive: true,
                    created: new Date()
                }
            });
            console.log(`  ✅ Created Category: ${config.categoryName} (ID: ${category.id})`);
        } else {
            console.log(`  ⏭️ Category already exists: ${config.categoryName} (ID: ${category.id})`);
        }

        // ── Step 5: Page-Category Mapping ──────────────────────────────
        let pageCatMapping = await prisma.formPageCategoryMapping.findFirst({
            where: { page_id: page.id, category_id: category.id, is_active: YnFlag.Y }
        });

        if (!pageCatMapping) {
            pageCatMapping = await prisma.formPageCategoryMapping.create({
                data: {
                    page_id: page.id,
                    category_id: category.id,
                    preference: 1,
                    is_active: YnFlag.Y
                }
            });
            console.log(`  ✅ Mapped Category to Page (ID: ${pageCatMapping.id})`);
        } else {
            console.log(`  ⏭️ Page-Category Mapping already exists.`);
        }

        // ── Step 6: Find Existing Master Field (NO NEW CREATION) ──────
        let masterField = await prisma.formField.findFirst({
            where: { formCheckId: config.fieldCode }
        });

        if (!masterField) {
            console.log(`  ❌ Master Field '${config.fieldCode}' not found. Skipping builder field.`);
            continue;
        }
        console.log(`  ⏭️ Reusing Master Field: ${masterField.name} (ID: ${masterField.id}, code: ${config.fieldCode})`);

        // ── Step 7: Form Builder Mapping ───────────────────────────────
        let builderField = await prisma.formBuilderField.findFirst({
            where: {
                service_id: SERVICE_ID,
                form_id: config.formTypeId,
                page_id: page.id,
                category_id: category.id,
                form_field_id: masterField.id,
                role_id: role.id,
                is_active: YnFlag.Y
            }
        });

        if (!builderField) {
            builderField = await prisma.formBuilderField.create({
                data: {
                    service_id: SERVICE_ID,
                    form_id: config.formTypeId,
                    page_id: page.id,
                    category_id: category.id,
                    tenant_id: TENANT_ID,
                    project_id: PROJECT_ID,
                    role_id: role.id,
                    form_field_id: masterField.id,
                    input_type: config.fieldType,
                    custom_label: config.customLabel,
                    preference: 1,
                    gridSpan: 12,
                    is_required: YnFlag.Y,
                    is_active: YnFlag.Y
                }
            });
            console.log(`  ✅ Created Builder Field Mapping (ID: ${builderField.id}) — label: "${config.customLabel}"`);
        } else {
            console.log(`  ⏭️ Builder Field Mapping already exists.`);
        }
    }

    console.log('\n==========================================================');
    console.log('🎉 Multi-Role Form Seeding Complete!');
    console.log('==========================================================\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
