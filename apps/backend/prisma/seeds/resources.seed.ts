import { PrismaClient } from '@prisma/client';

export async function seedResources(prisma: PrismaClient) {
  const resourcesData = [
    { code: 'MASTER_ALL', name: 'Master Module Full Access', path: '/master/*' },
    { code: 'USER_MANAGE', name: 'User Management', path: '/users' },
    { code: 'DASHBOARD_VIEW', name: 'Admin Dashboard Access', path: '/admin/dashboard' },
    { code: 'INVESTOR_DASHBOARD', name: 'Investor Dashboard Access', path: '/investor/dashboard' },
    { code: 'DEPARTMENT_DASHBOARD', name: 'Department Dashboard Access', path: '/user/dashboard' },
    { code: 'MASTER_ROLES', name: 'Manage Roles', path: '/roles' },
    { code: 'MASTER_RESOURCES', name: 'Manage Resources', path: '/resources' },
    { code: 'MASTER_ROLE_RESOURCES', name: 'Manage Role Resources', path: '/role-resources' },


    // Add below the existing resourcesData items
    { code: 'MASTER_DOCUMENT_TYPES_READ', name: 'Read Document Types', path: '/document-types' },
    { code: 'MASTER_ISSUERS_READ', name: 'Read Issuers', path: '/issuers' },
    { code: 'MASTER_DEPARTMENTS_READ', name: 'Read Departments', path: '/departments' },
    { code: 'MASTER_DOCUMENT_MASTERS_READ', name: 'Read Document Masters', path: '/document-masters' },

    // Investor documents (protected, investor-only)
    { code: 'INVESTOR_DOCUMENTS', name: 'Investor Documents Module', path: '/investor/documents*' },
    { code: 'INVESTOR_DEPARTMENTAL_SERVICES_APPLY', name: 'Investor Departmental Services Apply Module', path: '/investor/services*' },

    // JD Portal
    { code: 'JD_PORTAL', name: 'Joint Director Portal', path: '/jd-portal/*' },

    // Inspector
    { code: 'INSPECTOR_DASHBOARD', name: 'Inspector Dashboard', path: '/inspector/*' },

  ];

  console.log('Seeding resources...');

 for (const resource of resourcesData) {
await prisma.resources.upsert({
where: { code: resource.code },
update: {},
create: resource,
});
}

  console.log('Resources seeded successfully.');
}
