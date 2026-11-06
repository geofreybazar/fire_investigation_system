import { Test, TestingModule } from '@nestjs/testing';
import { InvestigationRepository } from './investigation.repository.js';
import { PrismaService } from '../../prisma.service.js';

const investigationId = '22222222-2222-4222-8222-222222222222';
const actorId = '33333333-3333-4333-8333-333333333333';

describe('InvestigationRepository', () => {
  let repository: InvestigationRepository;
  let tx: {
    investigation: Record<string, ReturnType<typeof vi.fn>>;
    investigationReport: Record<string, ReturnType<typeof vi.fn>>;
    investigationReportReview: { create: ReturnType<typeof vi.fn> };
  };
  let prisma: {
    $transaction: ReturnType<typeof vi.fn>;
    investigationReport: { updateMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    tx = {
      investigation: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      investigationReport: {
        findFirst: vi.fn().mockResolvedValue({ id: 'report-1' }),
        update: vi.fn(),
      },
      investigationReportReview: { create: vi.fn() },
    };
    prisma = {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      investigationReport: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestigationRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<InvestigationRepository>(InvestigationRepository);
  });

  describe('updateDraft', () => {
    it('creates the report as a DRAFT on first save', async () => {
      tx.investigation.findUnique.mockResolvedValue({
        completedAt: null,
        report: null,
      });

      await repository.updateDraft(investigationId, {
        investigation: { originOfFire: 'Kitchen' },
        report: { findings: 'Faulty wiring' },
      });

      expect(tx.investigation.update).toHaveBeenCalledWith({
        where: { id: investigationId },
        data: {
          originOfFire: 'Kitchen',
          report: {
            upsert: {
              create: { findings: 'Faulty wiring', status: 'DRAFT' },
              update: { findings: 'Faulty wiring' },
            },
          },
        },
      });
    });

    it('refuses once the report is submitted', async () => {
      tx.investigation.findUnique.mockResolvedValue({
        completedAt: null,
        report: { status: 'SUBMITTED' },
      });

      await expect(
        repository.updateDraft(investigationId, { investigation: {} }),
      ).resolves.toBe(false);
      expect(tx.investigation.update).not.toHaveBeenCalled();
    });
  });

  it('submits only an editable report of an open investigation', async () => {
    await repository.submitReport(investigationId);

    expect(prisma.investigationReport.updateMany).toHaveBeenCalledWith({
      where: {
        investigationId,
        status: { in: ['DRAFT', 'REJECTED'] },
        investigation: { completedAt: null },
      },
      data: { status: 'SUBMITTED', submittedAt: expect.any(Date) },
    });
  });

  describe('review', () => {
    it('approves: records the review and completes the investigation', async () => {
      await expect(
        repository.review(investigationId, 'APPROVED', actorId, null),
      ).resolves.toBe(true);

      expect(tx.investigationReport.findFirst).toHaveBeenCalledWith({
        where: {
          investigationId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
          investigation: { completedAt: null },
        },
        select: { id: true },
      });
      expect(tx.investigationReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: {
          status: 'APPROVED',
          reviewedAt: expect.any(Date),
          reviewedById: actorId,
        },
      });
      expect(tx.investigationReportReview.create).toHaveBeenCalledWith({
        data: {
          reportId: 'report-1',
          decision: 'APPROVED',
          reviewerId: actorId,
          remarks: null,
        },
      });
      expect(tx.investigation.update).toHaveBeenCalledWith({
        where: { id: investigationId },
        data: { completedAt: expect.any(Date) },
      });
    });

    it('rejects without completing the investigation', async () => {
      await repository.review(investigationId, 'REJECTED', actorId, 'Missing');

      expect(tx.investigation.update).not.toHaveBeenCalled();
    });

    it('refuses a decision the report is not ready for', async () => {
      tx.investigationReport.findFirst.mockResolvedValue(null);

      await expect(
        repository.review(investigationId, 'UNDER_REVIEW', actorId),
      ).resolves.toBe(false);
      expect(tx.investigationReportReview.create).not.toHaveBeenCalled();
    });
  });
});
