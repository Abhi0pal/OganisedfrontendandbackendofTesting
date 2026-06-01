import { PrismaClient } from '@prisma/client';
import { bo_workflow_config } from './data/bo_workflow_config.data';

const getWorkflowRoleIds = () => {
    const roleIds = new Set<number>();
    bo_workflow_config
        .filter((row) => row.service_id === '943.0')
        .forEach((row) => {
            ['current_role_id', 'next_role_id', 'approver_id', 'forward_role_id', 'revert_role_id']
                .forEach((key) => {
                    const value = Number((row as any)[key] || 0);
                    if (Number.isFinite(value) && value > 0) roleIds.add(value);
                });
        });
    return Array.from(roleIds);
};

export async function seedRoleResources(prisma: PrismaClient) {
    console.log('Seeding role resources...');

    // 1. Fetch Roles (using lowercase as per roles.seed.ts)
    const adminRole = await prisma.roles.findFirst({ where: { name: 'admin' } });
    const investorRole = await prisma.roles.findFirst({ where: { name: 'investor' } });
    const departmentRole = await prisma.roles.findFirst({ where: { name: 'department_user' } });
    const jdRole = await prisma.roles.findFirst({ where: { name: 'Joint_Director' } });
    const inspectorRole = await prisma.roles.findFirst({ where: { name: 'Inspector' } });

    if (!adminRole) {
        console.warn('Admin role not found. Skipping role_resources seeding for Admin.');
        return;
    }

    // 2. Fetch Resources
    const resources = await prisma.resources.findMany();
    const resourceMap = new Map(resources.map((r) => [r.code, r.id]));

    // 3. Define Assignments
    // Admin gets everything
    const adminResources = resources.map((r) => r.code);

    // Investor gets Dashboard only (for now)
    const investorResources = [
        'INVESTOR_DASHBOARD',
        'MASTER_DOCUMENT_TYPES_READ',
        'MASTER_ISSUERS_READ',
        'MASTER_DEPARTMENTS_READ',
        'MASTER_DOCUMENT_MASTERS_READ',
        'INVESTOR_DOCUMENTS',
        'INVESTOR_DEPARTMENTAL_SERVICES_APPLY',
    ];

    // Department user gets Department Dashboard + Inspector Dashboard
    const departmentResources = ['DEPARTMENT_DASHBOARD', 'INSPECTOR_DASHBOARD'];

    // JD gets JD Portal
    const jdResources = ['JD_PORTAL', 'DEPARTMENT_DASHBOARD'];

    // Inspector
    const inspectorResources = ['INSPECTOR_DASHBOARD', 'DEPARTMENT_DASHBOARD'];

    // 4. Helper to assign
    const assign = async (roleId: number, codes: string[]) => {
        for (const code of codes) {
            const resourceId = resourceMap.get(code);
            if (resourceId) {
                await prisma.roleResource.upsert({
                    where: {
                        role_id_resource_id: {
                            role_id: roleId,
                            resource_id: resourceId,
                        },
                    },
                    update: {},
                    create: {
                        role_id: roleId,
                        resource_id: resourceId,
                    },
                });
            }
        }
    };

    await assign(adminRole.id, adminResources);

    if (investorRole) {
        await assign(investorRole.id, investorResources);
    }

    if (departmentRole) {
        await assign(departmentRole.id, departmentResources);
    }

    if (jdRole) {
        await assign(jdRole.id, jdResources);
    }

    if (inspectorRole) {
        await assign(inspectorRole.id, inspectorResources);
    }

    // Ensure all officer roles used in workflow can access DEPARTMENT_DASHBOARD APIs
    const workflowRoleIds = getWorkflowRoleIds();
    for (const roleId of workflowRoleIds) {
        if (!Number.isFinite(roleId) || roleId <= 0) continue;
        await assign(roleId, ['DEPARTMENT_DASHBOARD']);
    }

    console.log('Role resources seeded successfully.');
}
