import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from './auth.repository.js';
import { PrismaService } from '../../prisma.service.js';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let prisma: {
    refreshToken: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
  });

  it('stores a hash of the refresh token, never the raw token', async () => {
    await repository.createRefreshToken('u1', 'raw-token');

    const { data } = prisma.refreshToken.create.mock.calls[0][0];
    expect(data.refreshToken).toBe(sha256('raw-token'));
    expect(data.refreshToken).not.toContain('raw-token');
    expect(data.userId).toBe('u1');
  });

  it('looks a refresh token up by its hash', async () => {
    await repository.findRefreshToken('raw-token');

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { refreshToken: sha256('raw-token') } }),
    );
  });
});
