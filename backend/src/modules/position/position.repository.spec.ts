import { Test, TestingModule } from '@nestjs/testing';
import { PositionRepository } from './position.repository.js';
import { PrismaService } from '../../prisma.service.js';

describe('PositionRepository', () => {
  let repository: PositionRepository;
  let prisma: {
    position: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      position: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<PositionRepository>(PositionRepository);
  });

  describe('findPaginatedPositions', () => {
    it('omits the password hash of users assigned to each position', async () => {
      await repository.findPaginatedPositions(0, 10);

      expect(prisma.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            users: {
              omit: {
                password: true,
                failedLoginCount: true,
                lockedUntil: true,
              },
            },
          },
        }),
      );
    });

    it('counts positions, not offices, for the total', async () => {
      prisma.position.count.mockResolvedValue(7);

      const result = await repository.findPaginatedPositions(0, 10);

      expect(prisma.position.count).toHaveBeenCalled();
      expect(result.total).toBe(7);
    });
  });
});
