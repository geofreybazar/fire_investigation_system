import { Test, TestingModule } from '@nestjs/testing';
import { type UUID } from 'crypto';
import { UsersRepository } from './users.repository.js';
import { PrismaService } from '../../prisma.service.js';
import { type UserInput } from './schema/user.schema.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

const userId = '11111111-1111-4111-8111-111111111111' as UUID;
const officeId = '22222222-2222-4222-8222-222222222222' as UUID;

const newInvestigator = {
  account_number: 'INV001',
  rank: 'FO2',
  first_name: 'Juan',
  last_name: 'Dela Cruz',
  email: 'juan@example.com',
  role: 'REGIONAL_INVESTIGATOR',
  officeId,
  positionId: '44444444-4444-4444-8444-444444444444',
} as UserInput;

const admin = (
  role: 'NHQ_ADMIN' | 'REGIONAL_ADMIN',
): CurrentUserJwtPayload => ({
  sub: '33333333-3333-4333-8333-333333333333' as UUID,
  account_number: 'ADMIN001',
  role,
  positionId: 'position-1',
  officeId,
});

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: {
    user: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    office: { findUnique: ReturnType<typeof vi.fn> };
    auditLog: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn(),
      },
      office: {
        findUnique: vi.fn().mockResolvedValue({ regionId: 'region-1' }),
      },
      auditLog: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation((callback) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  describe('createUser', () => {
    it('stores the password hash but omits it from the returned user', async () => {
      prisma.user.create.mockResolvedValue({ id: userId, ...newInvestigator });

      await repository.createUser('hashed-default', newInvestigator, 'actor-1');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...newInvestigator,
          password: 'hashed-default',
          mustChangePassword: true,
        }),
        omit: { password: true, failedLoginCount: true, lockedUntil: true },
      });
    });

    it('records the new user without the password', async () => {
      prisma.user.create.mockResolvedValue({ id: userId, ...newInvestigator });

      await repository.createUser('hashed-default', newInvestigator, 'actor-1');

      const { data } = prisma.auditLog.create.mock.calls[0][0];
      expect(data).toMatchObject({
        actorId: 'actor-1',
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: userId,
        officeId,
        regionId: 'region-1',
      });
      expect(data.changes).toMatchObject({ role: 'REGIONAL_INVESTIGATOR' });
      expect(JSON.stringify(data.changes)).not.toContain('hashed-default');
    });
  });

  describe('audit entries', () => {
    const stored = { id: userId, ...newInvestigator, isActive: true };

    it('records only the changed fields on edit', async () => {
      prisma.user.findUnique.mockResolvedValue(stored);
      prisma.user.update.mockResolvedValue({
        ...stored,
        role: 'REGIONAL_CHIEF_INVESTIGATOR',
      });

      await repository.editUser(
        userId,
        { ...newInvestigator, role: 'REGIONAL_CHIEF_INVESTIGATOR' },
        'actor-1',
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'USER_UPDATED',
          changes: {
            role: {
              from: 'REGIONAL_INVESTIGATOR',
              to: 'REGIONAL_CHIEF_INVESTIGATOR',
            },
          },
        }),
      });
    });

    it('writes nothing for an edit that changes nothing', async () => {
      prisma.user.findUnique.mockResolvedValue(stored);
      prisma.user.update.mockResolvedValue(stored);

      await repository.editUser(userId, newInvestigator, 'actor-1');

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('returns null and writes nothing for a missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        repository.editUser(userId, newInvestigator, 'actor-1'),
      ).resolves.toBeNull();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('records a deactivation', async () => {
      prisma.user.findUnique.mockResolvedValue({ isActive: true });
      prisma.user.update.mockResolvedValue({ ...stored, isActive: false });

      await repository.deactivateUser(userId, false, 'actor-1');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'USER_DEACTIVATED',
          changes: { isActive: { from: true, to: false } },
        }),
      });
    });

    it('records a password change with the user as actor and no values', async () => {
      prisma.user.update.mockResolvedValue(stored);

      await repository.changePassowrd('new-hash', userId);

      const { data } = prisma.auditLog.create.mock.calls[0][0];
      expect(data).toMatchObject({
        actorId: userId,
        action: 'USER_PASSWORD_CHANGED',
      });
      expect(data.changes).toBeUndefined();
    });
  });

  describe('findUserRoleById', () => {
    it('selects only id, role and office scope, without an isActive filter', async () => {
      await repository.findUserRoleById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          office: { select: { id: true, regionId: true } },
        },
      });
    });
  });

  describe('findPaginatedUsers', () => {
    it('omits the password hash from listed users', async () => {
      await repository.findPaginatedUsers(
        admin('NHQ_ADMIN'),
        '',
        officeId,
        10,
        0,
        'Active',
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          omit: { password: true, failedLoginCount: true, lockedUntil: true },
        }),
      );
    });

    it('limits REGIONAL_ADMIN to users in their own office and region', async () => {
      await repository.findPaginatedUsers(
        admin('REGIONAL_ADMIN'),
        '',
        '' as UUID,
        10,
        0,
        'Active',
      );

      const regionFilter = {
        OR: [{ id: officeId }, { regionId: officeId }],
      };
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ office: regionFilter }),
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ office: regionFilter }),
      });
    });

    it('applies no region filter for NHQ_ADMIN', async () => {
      await repository.findPaginatedUsers(
        admin('NHQ_ADMIN'),
        '',
        '' as UUID,
        10,
        0,
        'Active',
      );

      const { where } = prisma.user.findMany.mock.calls[0][0];
      expect(where).not.toHaveProperty('office');
    });
  });
});
