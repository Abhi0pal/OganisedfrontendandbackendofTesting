import { PrismaClient, YnFlag } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICE_ID = '12262.0';
const TENANT_ID = 6;
const PROJECT_ID = 5;
const DEPARTMENT_ID = 16; // Typically used for this service
const ROLE_NAME = 'Joint Director';
const FORM_TYPE_ID = 2;
const FORM_NAME = 'Joint Director Form';
const PAGE_NAME = 'Department Form';
const CATEGORY_NAME = 'Department Form';
const FIELD_LABEL = 'Comment';
const FIELD_TYPE = 'textarea'; 

async function main() {
    console.log('==========================================================');
    console.log(` SEEDING: Form for ${ROLE_NAME} (${SERVICE_ID})`);
    console.log('==========================================================\n');

    // ── Step 1: Ensure Role Exists ─────────────────────────────────
    let role = await prisma.roles.findFirst({
        where: { name: ROLE_NAME, tenant_id: TENANT_ID },
    });

    if (!role) {
        console.log(`❌ Role '${ROLE_NAME}' not found for tenant ${TENANT_ID}. Please create the role first.`);
        return;
    }
    console.log(`✅ Found Role: ${role.name} (ID: ${role.id})`);

    // ── Step 2: Form Mapping ───────────────────────────────────────
    let mapping = await prisma.formMapping.findFirst({
        where: {
            service_id: SERVICE_ID,
            form_type_id: FORM_TYPE_ID,
            tenant_id: TENANT_ID,
            project_id: PROJECT_ID,
            role_id: role.id
        }
    });

    if (!mapping) {
        mapping = await prisma.formMapping.create({
            data: {
                department_id: DEPARTMENT_ID,
                service_id: SERVICE_ID,
                form_type_id: FORM_TYPE_ID,
                form_name: FORM_NAME,
                form_code: 'JD_FORM',
                is_active: YnFlag.Y,
                tenant_id: TENANT_ID,
                project_id: PROJECT_ID,
                role_id: role.id,
                created: new Date(),
                modified: new Date()
            }
        });
        console.log(`✅ Created Form Mapping: ${FORM_NAME} (ID: ${mapping.id})`);
    } else {
        console.log(`⏭️ Form Mapping already exists: ${FORM_NAME} (ID: ${mapping.id})`);
    }

    // ── Step 3: Page Master ────────────────────────────────────────
    let page = await prisma.formPageMaster.findFirst({
        where: {
            service_id: SERVICE_ID,
            form_id: FORM_TYPE_ID,
            tenantId: TENANT_ID,
            projectId: PROJECT_ID,
            role_id: role.id,
            page_name: PAGE_NAME
        }
    });

    if (!page) {
        page = await prisma.formPageMaster.create({
            data: {
                service_id: SERVICE_ID,
                form_id: FORM_TYPE_ID,
                page_name: PAGE_NAME,
                preference: 1,
                is_active: YnFlag.Y,
                tenantId: TENANT_ID,
                projectId: PROJECT_ID,
                role_id: role.id,
                created: new Date(),
                modified: new Date()
            }
        });
        console.log(`✅ Created Page: ${PAGE_NAME} (ID: ${page.id})`);
    } else {
        console.log(`⏭️ Page already exists: ${PAGE_NAME} (ID: ${page.id})`);
    }

    // ── Step 4: Category Master ────────────────────────────────────
    const categoryCode = CATEGORY_NAME.toUpperCase().replace(/\s+/g, '_') + '_CAT';
    let category = await prisma.formCategory.findFirst({
        where: { categoryName: CATEGORY_NAME }
    });

    if (!category) {
        category = await prisma.formCategory.create({
            data: {
                categoryName: CATEGORY_NAME,
                categoryCode: categoryCode,
                tenantId: TENANT_ID,
                projectId: PROJECT_ID,
                isActive: true,
                created: new Date()
            }
        });
        console.log(`✅ Created Category: ${CATEGORY_NAME} (ID: ${category.id})`);
    } else {
        console.log(`⏭️ Category already exists: ${CATEGORY_NAME} (ID: ${category.id})`);
    }

    // ── Step 5: Page-Category Mapping ──────────────────────────────
    let pageCatMapping = await prisma.formPageCategoryMapping.findFirst({
        where: { page_id: page.id, category_id: category.id }
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
        console.log(`✅ Mapped Category to Page (ID: ${pageCatMapping.id})`);
    } else {
        console.log(`⏭️ Page-Category Mapping already exists.`);
    }

    // ── Step 6: Form Field Dictionary ──────────────────────────────
    const fieldCode = 'JD_COMMENT_FIELD';
    let masterField = await prisma.formField.findFirst({
        where: { formCheckId: fieldCode }
    });

    if (!masterField) {
        masterField = await prisma.formField.create({
            data: {
                name: FIELD_LABEL,
                formCheckId: fieldCode,
                categoryId: category.id,
                tenantId: TENANT_ID,
                projectId: PROJECT_ID,
                isActive: true,
                createdDate: new Date()
            }
        });
        console.log(`✅ Created Master Field: ${FIELD_LABEL} (ID: ${masterField.id})`);
    } else {
        console.log(`⏭️ Master Field already exists: ${FIELD_LABEL} (ID: ${masterField.id})`);
    }

    // ── Step 7: Form Builder Mapping ───────────────────────────────
    let builderField = await prisma.formBuilderField.findFirst({
        where: {
            service_id: SERVICE_ID,
            form_id: FORM_TYPE_ID,
            page_id: page.id,
            category_id: category.id,
            form_field_id: masterField.id,
            role_id: role.id
        }
    });

    if (!builderField) {
        builderField = await prisma.formBuilderField.create({
            data: {
                service_id: SERVICE_ID,
                form_id: FORM_TYPE_ID,
                page_id: page.id,
                category_id: category.id,
                tenant_id: TENANT_ID,
                project_id: PROJECT_ID,
                role_id: role.id,
                form_field_id: masterField.id,
                input_type: FIELD_TYPE,
                custom_label: FIELD_LABEL,
                preference: 1,
                gridSpan: 12,
                is_required: YnFlag.Y,
                is_active: YnFlag.Y
            }
        });
        console.log(`✅ Created Builder Field Mapping (ID: ${builderField.id})`);
    } else {
        console.log(`⏭️ Builder Field Mapping already exists.`);
    }

    console.log('\n==========================================================');
    console.log('🎉 Form Seeding Complete!');
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
