import { Test, TestingModule } from '@nestjs/testing';
import { FireIncidentCategoriesRepository } from './fire-incident-categories.repository.js';
import { PrismaService } from '../../prisma.service.js';

describe('FireIncidentCategoriesRepository', () => {
  let repository: FireIncidentCategoriesRepository;
  let prisma: {
    fireIncidentCategory: Record<string, ReturnType<typeof vi.fn>>;
  };

  beforeEach(async () => {
    prisma = {
      fireIncidentCategory: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FireIncidentCategoriesRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<FireIncidentCategoriesRepository>(
      FireIncidentCategoriesRepository,
    );
  });

  const countOnly = {
    subCategories: true,
    _count: { select: { cases: true } },
  };

  it('lists categories with a case count, not the cases', async () => {
    await repository.getPaginatedCategories('', 10, 0);

    expect(prisma.fireIncidentCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: countOnly }),
    );
  });

  it('reads one category with a case count, not the cases', async () => {
    await repository.getCategoryById('category-1');

    expect(prisma.fireIncidentCategory.findUnique).toHaveBeenCalledWith({
      where: { id: 'category-1' },
      include: countOnly,
    });
  });
});
