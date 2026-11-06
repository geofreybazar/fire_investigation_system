import { ForbiddenException } from '@nestjs/common';
import { OfficeType, ROLE } from '../../../generated/prisma/enums.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { CurrentUserJwtPayload } from '../../../types/jwt.payload.js';
import { CHIEF_INVESTIGATOR_ROLES } from './investigation-rules.js';

// Who may see which investigation cases (docs/REQUIREMENTS.md §6.3).

// Admins below SUPER_ADMIN manage users and offices only.
const NO_CASE_ACCESS: ROLE[] = [ROLE.NHQ_ADMIN, ROLE.REGIONAL_ADMIN];

// May view cases (within their scope): every role except the above.
export const CASE_VIEWER_ROLES: ROLE[] = Object.values(ROLE).filter(
  (role) => !NO_CASE_ACCESS.includes(role),
);

export interface ViewerScope {
  user: CurrentUserJwtPayload;
  officeType: OfficeType;
}

export interface OfficeScopeFields {
  id: string;
  parentId: string | null;
  regionId: string | null;
}

export interface CaseVisibilityFields {
  deletedAt: Date | null;
  station: OfficeScopeFields;
}

export const CITY_MUNICIPAL_STATIONS: OfficeType[] = [
  OfficeType.CITY_FIRE_STATION,
  OfficeType.MUNICIPAL_FIRE_STATION,
];

function assertMayViewCases(user: CurrentUserJwtPayload): void {
  if (NO_CASE_ACCESS.includes(user.role)) {
    throw new ForbiddenException(
      'You are not allowed to view investigation cases.',
    );
  }
}

function seesAllOffices({ user, officeType }: ViewerScope): boolean {
  return (
    user.role === ROLE.SUPER_ADMIN ||
    officeType === OfficeType.NATIONAL_HEADQUARTERS
  );
}

// A station is the viewer's own office or below it. The hierarchy is fixed
// (station → district/province → region → NHQ), so one of these matches.
export function isStationInScope(
  station: OfficeScopeFields,
  scope: ViewerScope,
): boolean {
  const officeId = scope.user.officeId;
  return (
    seesAllOffices(scope) ||
    station.id === officeId ||
    station.parentId === officeId ||
    station.regionId === officeId
  );
}

// Prisma filter for the stations below a viewer's office.
export function stationScopeWhere(scope: ViewerScope): Prisma.OfficeWhereInput {
  const officeId = scope.user.officeId;
  return seesAllOffices(scope)
    ? {}
    : {
        OR: [{ id: officeId }, { parentId: officeId }, { regionId: officeId }],
      };
}

// Prisma filter for the cases a viewer may list. Deleted cases are never
// included; SUPER_ADMIN reads those through a separate listing.
export function caseScopeWhere(
  scope: ViewerScope,
): Prisma.InvestigationCaseWhereInput {
  assertMayViewCases(scope.user);

  return {
    deletedAt: null,
    ...(!seesAllOffices(scope) && { station: stationScopeWhere(scope) }),
  };
}

// The same rule for a single, already-loaded case.
export function isCaseVisible(
  investigationCase: CaseVisibilityFields,
  scope: ViewerScope,
): boolean {
  assertMayViewCases(scope.user);

  return (
    investigationCase.deletedAt === null &&
    isStationInScope(investigationCase.station, scope)
  );
}

export function isChief(user: CurrentUserJwtPayload): boolean {
  return (
    user.role === ROLE.SUPER_ADMIN ||
    CHIEF_INVESTIGATOR_ROLES.includes(user.role)
  );
}

// The chief investigator of the handling office (or SUPER_ADMIN) decides,
// refers, assigns and reviews.
export function isHandlingChief(
  user: CurrentUserJwtPayload,
  officeId: string,
): boolean {
  return (
    user.role === ROLE.SUPER_ADMIN ||
    (CHIEF_INVESTIGATOR_ROLES.includes(user.role) && user.officeId === officeId)
  );
}

export function assertHandlingChief(
  user: CurrentUserJwtPayload,
  officeId: string,
): void {
  if (!isHandlingChief(user, officeId)) {
    throw new ForbiddenException(
      "Only the handling office's chief investigator can do this.",
    );
  }
}
