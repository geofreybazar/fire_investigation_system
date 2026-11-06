import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { type UUID } from 'crypto';
import { AuditService } from './audit.service.js';
import { AuditRepository } from './audit.repository.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

const regionalOfficeId = 'region-1';

const userWithRole = (
  role: CurrentUserJwtPayload['role'],
): CurrentUserJwtPayload => ({
  sub: '11111111-1111-4111-8111-111111111111' as UUID,
  account_number: 'ADMIN001',
  role,
  positionId: 'position-1',
  officeId: regionalOfficeId,
});

const ADMIN_TYPES = [
  'USER',
  'OFFICE',
  'POSITION',
  'FIRE_INCIDENT_CATEGORY',
  'FIRE_INCIDENT_SUBCATEGORY',
];

describe('AuditService', () => {
  let service: AuditService;
  let repository: { findPaginated: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    repository = {
      findPaginated: vi.fn().mockResolvedValue({ auditLogs: [], total: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  const scopeFor = async (role: CurrentUserJwtPayload['role']) => {
    await service.findPaginated({ page: 1 }, userWithRole(role));
    return repository.findPaginated.mock.calls[0][0].AND[0];
  };

  it('lets SUPER_ADMIN read every entry', async () => {
    await expect(scopeFor('SUPER_ADMIN')).resolves.toEqual({});
  });

  it('limits NHQ_ADMIN to admin changes', async () => {
    await expect(scopeFor('NHQ_ADMIN')).resolves.toEqual({
      entityType: { in: ADMIN_TYPES },
    });
  });

  it('limits REGIONAL_ADMIN to its region plus its own actions', async () => {
    const user = userWithRole('REGIONAL_ADMIN');

    await expect(scopeFor('REGIONAL_ADMIN')).resolves.toEqual({
      OR: [
        {
          entityType: { in: ['USER', 'OFFICE'] },
          OR: [{ officeId: regionalOfficeId }, { regionId: regionalOfficeId }],
        },
        { actorId: user.sub, entityType: { in: ADMIN_TYPES } },
      ],
    });
  });

  it('forbids every other role', async () => {
    await expect(
      service.findPaginated({ page: 1 }, userWithRole('NHQ_VIEWER')),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.findPaginated).not.toHaveBeenCalled();
  });

  it('applies the filters and paginates by 20', async () => {
    repository.findPaginated.mockResolvedValue({ auditLogs: [], total: 45 });
    const from = new Date('2026-10-01T00:00:00.000Z');

    const result = await service.findPaginated(
      { page: 3, action: 'USER_UPDATED', entityType: 'USER', from },
      userWithRole('SUPER_ADMIN'),
    );

    expect(repository.findPaginated).toHaveBeenCalledWith(
      {
        AND: [
          {},
          {
            action: 'USER_UPDATED',
            entityType: 'USER',
            createdAt: { gte: from },
          },
        ],
      },
      40,
      20,
    );
    expect(result.pagination).toEqual({
      page: 3,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });
});
