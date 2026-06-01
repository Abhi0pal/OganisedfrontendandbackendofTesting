import { PrismaClient } from '@prisma/client';
import { bo_workflow_config } from './data/bo_workflow_config.data';
import { bo_roles } from './data/bo_roles.data';

const REQUIRED_ROLE_IDS = new Set<number>();
const RESERVED_ROLE_IDS = new Set<number>([1, 2, 3, 4]);

const loadRequiredRoles = () => {
  bo_workflow_config
    .filter((row) => row.service_id === '943.0')
    .forEach((row) => {
      ['current_role_id', 'next_role_id', 'approver_id', 'forward_role_id', 'revert_role_id']
        .forEach((key) => {
          const value = Number(row[key] || 0);
          if (Number.isFinite(value) && value > 0) {
            REQUIRED_ROLE_IDS.add(value);
          }
        });
    });
};

export async function seedRoles(prisma: PrismaClient) {
  try {
    loadRequiredRoles();

    const baseRoles = [
      { id: 1, name: 'admin' },
      { id: 2, name: 'investor' },
      { id: 3, name: 'department_user' },
      { id: 4, name: 'Joint_Director' },
      { id: 200, name: 'Inspector' },
    ];

    for (const role of baseRoles) {
      await prisma.roles.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role,
      });
    }

    const rolesFromCsv = bo_roles
      .filter((row) => {
        const roleId = Number(row.role_id);
        return REQUIRED_ROLE_IDS.has(roleId) && !RESERVED_ROLE_IDS.has(roleId);
      })
      .map((row) => ({
        id: Number(row.role_id),
        name: row.role_name || `role_${row.role_id}`,
      }));

    for (const role of rolesFromCsv) {
      if (!Number.isFinite(role.id)) continue;
      await prisma.roles.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role,
      });
    }

    const extraByName = ['Inspector', 'CIS_Admin'];
    const maxRole = await prisma.roles.aggregate({ _max: { id: true } });
    let nextRoleId = Number(maxRole._max.id || 0) + 1;

    for (const roleName of extraByName) {
      const existing = await prisma.roles.findFirst({ where: { name: roleName } });
      if (!existing) {
        await prisma.roles.create({ data: { id: nextRoleId++, name: roleName } });
      }
    }

    console.log(`  seeded ${baseRoles.length + rolesFromCsv.length} roles`);
  } catch (error) {
    console.error('  role seeding failed:', error);
    throw error;
  }
}
