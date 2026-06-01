import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function stringifyForTs(value: unknown): string {
  return JSON.stringify(
    value,
    (_, v) => {
      if (typeof v === 'bigint') return v.toString();
      return v;
    },
    2
  );
}

async function main() {
  const serviceId = process.env.SNAPSHOT_SERVICE_ID || '943.0';

  const submission = await prisma.applicationSubmission.findFirst({
    where: { serviceId },
    orderBy: [{ submittedOn: 'desc' }, { submissionId: 'desc' }],
  });

  if (!submission) {
    throw new Error(`No application submission found for service ${serviceId}`);
  }

  const investorUser = await prisma.users.findUnique({
    where: { id: submission.userId },
    select: { email: true },
  });

  const spApplication = await prisma.spApplication.findFirst({
    where: { appId: BigInt(submission.submissionId) },
    orderBy: { sno: 'desc' },
  });

  const forwardApplications = await prisma.forwardApplication.findMany({
    where: { appSubId: submission.submissionId },
    orderBy: { apprLvlId: 'asc' },
  });

  const paymentDetails = await prisma.paymentDetail.findMany({
    where: { appSubId: submission.submissionId },
    orderBy: { paymentId: 'asc' },
  });

  const applicationHistory = await prisma.applicationHistory.findMany({
    where: {
      OR: [
        { appId: String(submission.submissionId) },
        ...(spApplication ? [{ sno: spApplication.sno }] : []),
      ],
    },
    orderBy: { historyId: 'asc' },
  });

  const dmsMappings = spApplication
    ? await prisma.applicationDmsDocumentsMapping.findMany({
        where: { sno: BigInt(spApplication.sno) },
        orderBy: { mappingId: 'asc' },
      })
    : [];

  const docIds = dmsMappings.map((x) => Number(x.documentsId)).filter((x) => Number.isFinite(x) && x > 0);
  const investorDocuments = docIds.length
    ? await prisma.investorDocument.findMany({
        where: { id: { in: docIds.map((x) => BigInt(x)) } },
        orderBy: { id: 'asc' },
      })
    : [];

  const payload = {
    source: {
      serviceId,
      investorEmail: investorUser?.email || 'investor@example.com',
      capturedAt: new Date().toISOString(),
    },
    submission,
    spApplication,
    forwardApplications,
    applicationHistory,
    paymentDetails,
    investorDocuments,
    dmsMappings,
  };

  const fileBody = `export const inprincipleLiveSnapshotData = ${stringifyForTs(payload)} as const;\n`;
  const outPath = path.resolve(__dirname, 'data', 'inprinciple-live-snapshot.data.ts');
  fs.writeFileSync(outPath, fileBody, 'utf8');
  console.log(`Snapshot exported to ${outPath}`);
}

main()
  .catch((err) => {
    console.error('Failed to export inprinciple live snapshot:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

