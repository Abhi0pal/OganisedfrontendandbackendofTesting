import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true }
  });
  console.log('Available Tenants:');
  console.table(tenants);

  // Tenant model is Tenant, property is tenant
  // Department model is Department, property is department
  // Service model is Service, property is service

  const departments = await prisma.department.findMany({
    where: { tenant_id: 4 },
    select: { id: true, name: true }
  });
  console.log('\nDepartments for Tenant 4:');
  console.table(departments);

  const services = await prisma.service.findMany({
    where: { tenantId: 4 },
    select: { id: true, service_id: true, service_name: true }
  });
  console.log('\nServices for Tenant 4:');
  console.table(services);
}

main().catch(console.error).finally(() => prisma.$disconnect());
