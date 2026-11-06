import { type Prisma } from '../../../generated/prisma/client.js';
import { generateCaseNumber } from './generate-case-number.js';

const txWith = (lastNumber: number) => {
  const upsert = vi.fn().mockResolvedValue({ lastNumber });
  return {
    tx: {
      incidentNumberCounter: { upsert },
    } as unknown as Prisma.TransactionClient,
    upsert,
  };
};

describe('generateCaseNumber', () => {
  it('formats INV-YYYY-MM-<REGION>-NNNNNN from the region counter', async () => {
    const { tx, upsert } = txWith(42);

    await expect(
      generateCaseNumber(tx, ' ncr ', new Date('2026-11-06T04:00:00Z')),
    ).resolves.toBe('INV-2026-11-NCR-000042');
    expect(upsert).toHaveBeenCalledWith({
      where: {
        year_month_regionCode: { year: 2026, month: 11, regionCode: 'NCR' },
      },
      create: { year: 2026, month: 11, regionCode: 'NCR', lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
      select: { lastNumber: true },
    });
  });

  it('uses the month in Asia/Manila time', async () => {
    const { tx } = txWith(1);

    // 2026-10-31 17:00 UTC is already November 1 in Manila.
    await expect(
      generateCaseNumber(tx, 'R4A', new Date('2026-10-31T17:00:00Z')),
    ).resolves.toBe('INV-2026-11-R4A-000001');
  });

  it('requires a region code', async () => {
    const { tx } = txWith(1);

    await expect(generateCaseNumber(tx, '  ')).rejects.toThrow(
      'Region code is required',
    );
  });
});
