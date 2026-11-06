import { ForbiddenException } from '@nestjs/common';
import { type UUID } from 'crypto';
import { OfficeAuthorizationService } from './office.authorization.service.js';
import { type CurrentUserJwtPayload } from '../../../types/jwt.payload.js';
import { type ROLE } from '../../../generated/prisma/enums.js';

const userWithRole = (role: ROLE): CurrentUserJwtPayload => ({
  sub: '11111111-1111-4111-8111-111111111111' as UUID,
  account_number: 'ACC001',
  role,
  positionId: 'position-1',
  officeId: 'office-1',
});

describe('OfficeAuthorizationService', () => {
  const service = new OfficeAuthorizationService();

  it('allows SUPER_ADMIN to manage National Headquarters', () => {
    expect(() =>
      service.canManageOffice(
        userWithRole('SUPER_ADMIN'),
        'NATIONAL_HEADQUARTERS',
      ),
    ).not.toThrow();
  });

  it('allows NHQ_ADMIN to manage regional offices but not NHQ', () => {
    const user = userWithRole('NHQ_ADMIN');

    expect(() =>
      service.canManageOffice(user, 'REGIONAL_OFFICE'),
    ).not.toThrow();
    expect(() =>
      service.canManageOffice(user, 'NATIONAL_HEADQUARTERS'),
    ).toThrow(ForbiddenException);
  });

  it('allows REGIONAL_ADMIN to manage stations but not regional offices', () => {
    const user = userWithRole('REGIONAL_ADMIN');

    expect(() =>
      service.canManageOffice(user, 'MUNICIPAL_FIRE_STATION'),
    ).not.toThrow();
    expect(() => service.canManageOffice(user, 'REGIONAL_OFFICE')).toThrow(
      'REGIONAL_ADMIN is not allowed to manage a REGIONAL_OFFICE',
    );
  });

  it('forbids non-admin roles from managing any office', () => {
    expect(() =>
      service.canManageOffice(
        userWithRole('NHQ_INVESTIGATOR'),
        'CITY_FIRE_STATION',
      ),
    ).toThrow(ForbiddenException);
  });

  describe('assertOfficeInScope', () => {
    const regionalAdmin = userWithRole('REGIONAL_ADMIN');

    it.each(['SUPER_ADMIN', 'NHQ_ADMIN'] as ROLE[])(
      'lets %s act on offices in any region',
      (role) => {
        expect(() =>
          service.assertOfficeInScope(userWithRole(role), {
            id: 'station-9',
            regionId: 'other-region',
          }),
        ).not.toThrow();
      },
    );

    it('lets REGIONAL_ADMIN act on their own office and offices in their region', () => {
      expect(() =>
        service.assertOfficeInScope(regionalAdmin, {
          id: 'office-1',
          regionId: null,
        }),
      ).not.toThrow();
      expect(() =>
        service.assertOfficeInScope(regionalAdmin, {
          id: 'station-1',
          regionId: 'office-1',
        }),
      ).not.toThrow();
    });

    it.each(['CITY_MUNICIPALITY_OPERATION_STAFF', 'NHQ_VIEWER'] as ROLE[])(
      'forbids non-admin role %s even for an office in its own region',
      (role) => {
        expect(() =>
          service.assertOfficeInScope(userWithRole(role), {
            id: 'station-1',
            regionId: 'office-1',
          }),
        ).toThrow(ForbiddenException);
      },
    );

    it('forbids REGIONAL_ADMIN from acting on offices outside their region', () => {
      expect(() =>
        service.assertOfficeInScope(regionalAdmin, {
          id: 'station-9',
          regionId: 'other-region',
        }),
      ).toThrow(ForbiddenException);
      expect(() =>
        service.assertOfficeInScope(regionalAdmin, {
          id: 'nhq',
          regionId: null,
        }),
      ).toThrow(ForbiddenException);
    });
  });
});
