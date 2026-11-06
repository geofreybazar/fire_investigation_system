import { Prisma } from '../../../generated/prisma/client.js';

// INV-YYYY-MM-<REGIONCODE>-NNNNNN. The sequence restarts each month per
// region; year and month are taken in Asia/Manila time. Must run inside the
// transaction that creates the case.
export async function generateCaseNumber(
  tx: Prisma.TransactionClient,
  regionCode: string,
  date: Date = new Date(),
): Promise<string> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);

  const normalizedRegionCode = regionCode.trim().toUpperCase();

  if (!normalizedRegionCode) {
    throw new Error('Region code is required');
  }

  const counter = await tx.incidentNumberCounter.upsert({
    where: {
      year_month_regionCode: { year, month, regionCode: normalizedRegionCode },
    },
    create: { year, month, regionCode: normalizedRegionCode, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  });

  const sequence = String(counter.lastNumber).padStart(6, '0');

  return `INV-${year}-${String(month).padStart(2, '0')}-${normalizedRegionCode}-${sequence}`;
}
