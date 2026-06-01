import { PrismaClient, WorkflowDefinitionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ── Pass the service_id as a CLI argument ──────────────────────────
const SERVICE_ID = process.argv[2];

if (!SERVICE_ID) {
    console.error('Usage: npx ts-node list-service-users.ts <service_id>');
    console.error('Example: npx ts-node list-service-users.ts 12262.0');
    process.exit(1);
}

// All seeded users use this password
const DEFAULT_PASSWORD = 'password123';

interface WfProcess {
    name: string;
    roleId: number | null;
    nodeType: string;
    processCode: string;
    stepOrder: number;
}

async function main() {
    // ── 1. Get the workflow configuration ──────────────────────────
    const config = await prisma.workflowConfiguration.findFirst({
        where: { serviceId: SERVICE_ID, status: WorkflowDefinitionStatus.PUBLISHED },
    });

    if (!config) {
        // Try any status if ACTIVE not found
        const anyConfig = await prisma.workflowConfiguration.findFirst({
            where: { serviceId: SERVICE_ID },
        });
        if (!anyConfig) {
            console.error(`❌ No workflow configuration found for service_id = ${SERVICE_ID}`);
            process.exit(1);
        }
        // Use anyConfig
        await processConfig(anyConfig);
        return;
    }

    await processConfig(config);
}

async function processConfig(config: any) {
    const serviceName = config.name || config.service?.service_name || SERVICE_ID;
    const configuration = config.configuration as { processes: WfProcess[] };

    if (!configuration?.processes?.length) {
        console.error('❌ No processes found in configuration JSON.');
        process.exit(1);
    }

    // ── 2. Extract roles from workflow processes ───────────────────
    const roleProcesses = configuration.processes
        .filter((p) => p.roleId != null && p.nodeType !== 'START' && p.nodeType !== 'END')
        .sort((a, b) => a.stepOrder - b.stepOrder);

    if (roleProcesses.length === 0) {
        console.log('No role-based processes found in the workflow.');
        return;
    }

    // ── 3. Fetch roles and users ──────────────────────────────────
    const roleIds = [...new Set(roleProcesses.map((p) => p.roleId!))];

    const roles = await prisma.roles.findMany({
        where: { id: { in: roleIds } },
    });
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    const users = await prisma.users.findMany({
        where: { role_id: { in: roleIds }, is_active: true },
        select: { id: true, email: true, role_id: true },
    });
    const usersByRole = new Map<number, string[]>();
    for (const u of users) {
        if (!u.role_id) continue;
        if (!usersByRole.has(u.role_id)) usersByRole.set(u.role_id, []);
        usersByRole.get(u.role_id)!.push(u.email);
    }

    // ── 4. Print table ────────────────────────────────────────────
    console.log(`\n Service: ${serviceName} (${SERVICE_ID})`);
    console.log('─'.repeat(100));
    console.log(
        padRight('Sl.No', 7) +
        padRight('Service Name', 30) +
        padRight('Role Name', 30) +
        padRight('Username', 35) +
        padRight('Password', 15)
    );
    console.log('─'.repeat(100));

    let slNo = 1;
    for (const proc of roleProcesses) {
        const roleName = roleMap.get(proc.roleId!) ?? `Unknown (${proc.roleId})`;
        const emails = usersByRole.get(proc.roleId!) ?? ['(no user found)'];

        for (const email of emails) {
            console.log(
                padRight(String(slNo), 7) +
                padRight(serviceName.substring(0, 28), 30) +
                padRight(roleName.substring(0, 28), 30) +
                padRight(email.substring(0, 33), 35) +
                padRight(DEFAULT_PASSWORD, 15)
            );
            slNo++;
        }
    }
    console.log('─'.repeat(100));
    console.log(`\n Total: ${slNo - 1} user(s)\n`);
}

function padRight(str: string, len: number): string {
    return str.padEnd(len);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
