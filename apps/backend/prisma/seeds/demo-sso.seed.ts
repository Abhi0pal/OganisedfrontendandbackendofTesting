
import { PrismaClient } from '@prisma/client';

export async function seedDemoSso(prisma: PrismaClient) {
  // Ensure an Issuer exists (use the first issuer or create one)
  const issuer =
    (await prisma.issuer.findFirst()) ??
    (await prisma.issuer.create({
      data: { name: 'Demo Issuer', isIssuerActive: true },
    }));

  // Upsert Department with the exact uniqueTag your FE demo uses
  const dept = await prisma.department.upsert({
    where: { uniqueTag: 'SIIDCUL_SWCS_$#@' }, // unique in your schema
    update: {
      name: 'SIIDCUL (Demo Dept)',
      ip: '127.0.0.1',
      secretKey: 'demo-secret',
      baseUrl: 'http://localhost:3001/mock',
      publicKey: 'demo-public-key',
      abbreviation: 'SIID',
      isActive: true,
      issuerId: issuer.id,
    },
    create: {
      name: 'SIIDCUL (Demo Dept)',
      uniqueTag: 'SIIDCUL_SWCS_$#@',
      ip: '127.0.0.1',
      secretKey: 'demo-secret',
      baseUrl: 'http://localhost:3001/mock',
      publicKey: 'demo-public-key',
      abbreviation: 'SIID',
      isActive: true,
      issuerId: issuer.id,
    },
  });

  // Ensure Service with service_id = '21' exists and points to the mock
  const existing = await prisma.service.findFirst({ where: { service_id: '21' } });
  if (existing) {
    await prisma.service.update({
      where: { id: existing.id },
      data: {
        department_id: dept.id,
        service_status: 'INTEGRATED',
        isActive: true,
      },
    });
  } else {
    await prisma.service.create({
      data: {
        service_id: '21',
        department_id: dept.id,
        service_status: 'INTEGRATED',
        isActive: true,
      },
    });
  }

  console.log('✅ Demo SSO seed: Department & Service ready for /en/sso-test');
}
