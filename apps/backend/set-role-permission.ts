import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const ROLE_ID = 219;
    const PERMISSION_VALUE = 'Investor';

    console.log(`🚀 Setting role_permission for Role ID ${ROLE_ID} to "${PERMISSION_VALUE}"...`);

    try {
        // 1. Attempt to update a column named 'role_permission' via raw SQL
        // We use raw SQL because the column might exist in DB but not in Prisma schema
        await prisma.$executeRawUnsafe(`
            UPDATE roles 
            SET role_permission = $1 
            WHERE id = $2
        `, PERMISSION_VALUE, ROLE_ID);
        
        console.log(`✅ Successfully updated 'role_permission' column via raw SQL.`);
    } catch (e: any) {
        if (e.message.includes('column "role_permission" does not exist')) {
            console.log(`ℹ️ Column 'role_permission' does not exist. Attempting alternative...`);
            
            // 2. Alternative: Link via RolePermission table if that's the intended structure
            // But usually, when a user says "Role permission Investor", they refer to a specific field.
            // Let's check if there's a 'type' or 'role_type' column instead.
            try {
                await prisma.$executeRawUnsafe(`
                    UPDATE roles 
                    SET role_type = $1 
                    WHERE id = $2
                `, PERMISSION_VALUE, ROLE_ID);
                console.log(`✅ Successfully updated 'role_type' column instead.`);
            } catch (e2: any) {
                console.error(`❌ Could not find a suitable column to update.`);
                console.error(`Original Error: ${e.message}`);
                console.error(`Second Error: ${e2.message}`);
            }
        } else {
            console.error(`❌ Unexpected error: ${e.message}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
