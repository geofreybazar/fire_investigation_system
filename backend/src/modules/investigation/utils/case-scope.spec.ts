import { ForbiddenException } from '@nestjs/common';
import { type UUID } from 'crypto';
import { type OfficeType, type ROLE } from '../../../generated/prisma/enums.js';
import { type CurrentUserJwtPayload } from '../../../types/jwt.payload.js';
import {
  CASE_VIEWER_ROLES,
  caseScopeWhere,
  isCaseVisible,
  isHandlingChief,
  isStationInScope,
  type ViewerScope,
} from './case-scope.js';

const station = {
  id: 'station-1',
  parentId: 'district-1',
  regionId: 'region-1',
};

const scopeOf = (
  role: ROLE,
  officeId: string,
  officeType: OfficeType,
): ViewerScope => ({
  user: {
    sub: '11111111-1111-4111-8111-111111111111' as UUID,
    account_number: 'ACC001',
    role,
    positionId: 'position-1',
    officeId,
  } as CurrentUserJwtPayload,
  officeType,
});

describe('case scope', () => {
  it('keeps NHQ_ADMIN and REGIONAL_ADMIN out', () => {
    expect(CASE_VIEWER_ROLES).not.toContain('NHQ_ADMIN');
    expect(CASE_VIEWER_ROLES).not.toContain('REGIONAL_ADMIN');
    expect(CASE_VIEWER_ROLES).toContain('SUPER_ADMIN');

    expect(() =>
      caseScopeWhere(scopeOf('REGIONAL_ADMIN', 'region-1', 'REGIONAL_OFFICE')),
    ).toThrow(ForbiddenException);
  });

  it.each([
    ['the station itself', 'station-1', 'CITY_FIRE_STATION', true],
    ['its district', 'district-1', 'DISTRICT_FIRE_STATION', true],
    ['its region', 'region-1', 'REGIONAL_OFFICE', true],
    ['NHQ', 'nhq', 'NATIONAL_HEADQUARTERS', true],
    ['another station', 'station-2', 'CITY_FIRE_STATION', false],
    ['another region', 'region-2', 'REGIONAL_OFFICE', false],
  ] as const)(
    'a case at a station is visible to %s: %s',
    (_label, officeId, type, visible) => {
      const scope = scopeOf('REGIONAL_VIEWER', officeId, type);

      expect(isStationInScope(station, scope)).toBe(visible);
      expect(isCaseVisible({ deletedAt: null, station }, scope)).toBe(visible);
    },
  );

  it('hides deleted cases from everyone, SUPER_ADMIN included', () => {
    expect(
      isCaseVisible(
        { deletedAt: new Date(), station },
        scopeOf('SUPER_ADMIN', 'nhq', 'NATIONAL_HEADQUARTERS'),
      ),
    ).toBe(false);
  });

  it('builds the matching Prisma filter', () => {
    expect(
      caseScopeWhere(scopeOf('REGIONAL_VIEWER', 'region-1', 'REGIONAL_OFFICE')),
    ).toEqual({
      deletedAt: null,
      station: {
        OR: [
          { id: 'region-1' },
          { parentId: 'region-1' },
          { regionId: 'region-1' },
        ],
      },
    });
    expect(
      caseScopeWhere(scopeOf('NHQ_VIEWER', 'nhq', 'NATIONAL_HEADQUARTERS')),
    ).toEqual({ deletedAt: null });
  });

  it('treats only chief investigators of the office, or SUPER_ADMIN, as the handling chief', () => {
    const user = (role: ROLE, officeId: string) =>
      scopeOf(role, officeId, 'CITY_FIRE_STATION').user;

    expect(
      isHandlingChief(
        user('CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', 'station-1'),
        'station-1',
      ),
    ).toBe(true);
    expect(
      isHandlingChief(
        user('CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', 'station-2'),
        'station-1',
      ),
    ).toBe(false);
    expect(
      isHandlingChief(
        user('CITY_MUNICIPALITY_INVESTIGATOR', 'station-1'),
        'station-1',
      ),
    ).toBe(false);
    expect(isHandlingChief(user('SUPER_ADMIN', 'nhq'), 'station-1')).toBe(true);
  });
});
