import { BadRequestException } from '@nestjs/common';
import {
  CauseOfFire,
  FireCaseClassification,
  OfficeType,
  ReferralDirection,
  ReportDecision,
  ReportStatus,
  ROLE,
} from '../../../generated/prisma/enums.js';

// Investigation rules (docs/REQUIREMENTS.md §5). Pure functions.

// The chief investigator of the handling office decides, refers, assigns and reviews.
export const CHIEF_INVESTIGATOR_ROLES: ROLE[] = [
  ROLE.CITY_MUNICIPALITY_CHIEF_INVESTIGATOR,
  ROLE.DISTRICT_PROVINCE_CHIEF_INVESTIGATOR,
  ROLE.REGIONAL_CHIEF_INVESTIGATOR,
  ROLE.NHQ_CHIEF_INVESTIGATOR,
];

// Users who can be assigned an investigation.
export const INVESTIGATOR_ROLES: ROLE[] = [
  ROLE.CITY_MUNICIPALITY_INVESTIGATOR,
  ROLE.DISTRICT_PROVINCE_INVESTIGATOR,
  ROLE.REGIONAL_INVESTIGATOR,
  ROLE.NHQ_INVESTIGATOR,
];

// The investigator may edit the investigation and report in these states.
export const REPORT_EDITABLE_STATUSES: ReportStatus[] = [
  ReportStatus.DRAFT,
  ReportStatus.REJECTED,
];

// Which report states each review decision may be taken from.
export const REVIEW_FROM: Record<ReportDecision, ReportStatus[]> = {
  [ReportDecision.UNDER_REVIEW]: [ReportStatus.SUBMITTED],
  [ReportDecision.APPROVED]: [
    ReportStatus.SUBMITTED,
    ReportStatus.UNDER_REVIEW,
  ],
  [ReportDecision.REJECTED]: [
    ReportStatus.SUBMITTED,
    ReportStatus.UNDER_REVIEW,
  ],
};

export interface ChainOffice {
  id: string;
  name: string;
  type: OfficeType;
}

export interface StationWithAncestors extends ChainOffice {
  parent: ChainOffice | null;
  region: (ChainOffice & { parent: ChainOffice | null }) | null;
}

// The case station's chain, lowest first: station → district/province →
// region → NHQ. Cases can only move along this chain.
export function stationChain(station: StationWithAncestors): ChainOffice[] {
  const chain: ChainOffice[] = [station];

  if (station.parent) chain.push(station.parent);
  if (station.region) chain.push(station.region);
  if (station.region?.parent) chain.push(station.region.parent);

  return chain.map(({ id, name, type }) => ({ id, name, type }));
}

// Up to any office above the handling office, or down to any office below it,
// as long as it is in the station's chain.
export function referralDirection(
  chain: ChainOffice[],
  fromOfficeId: string,
  toOfficeId: string,
): ReferralDirection {
  const from = chain.findIndex((office) => office.id === fromOfficeId);
  const to = chain.findIndex((office) => office.id === toOfficeId);

  if (from === -1 || to === -1) {
    throw new BadRequestException(
      "A case can only be referred within the station's own office chain.",
    );
  }

  if (from === to) {
    throw new BadRequestException(
      'The case is already handled by that office.',
    );
  }

  return to > from ? ReferralDirection.UP : ReferralDirection.DOWN;
}

export function referralTargets(
  chain: ChainOffice[],
  fromOfficeId: string,
): (ChainOffice & { direction: ReferralDirection })[] {
  const from = chain.findIndex((office) => office.id === fromOfficeId);

  return chain
    .map((office, index) => ({ office, index }))
    .filter(({ index }) => from !== -1 && index !== from)
    .map(({ office, index }) => ({
      ...office,
      direction: index > from ? ReferralDirection.UP : ReferralDirection.DOWN,
    }));
}

// What a moved station means for a case located at it (Q-51). A case handled outside
// the station's new chain blocks the move until its work is finished; once it
// is, the case goes back to the station so it can still be referred.
export function caseAfterStationMove(
  chain: ChainOffice[],
  handlingOfficeId: string,
  investigations: { conductingOfficeId: string; completedAt: Date | null }[],
): 'STAYS' | 'BLOCKS_MOVE' | 'RETURNS_TO_STATION' {
  if (chain.some((office) => office.id === handlingOfficeId)) {
    return 'STAYS';
  }

  const finished =
    investigations.every(({ completedAt }) => completedAt !== null) &&
    investigations.some(
      ({ conductingOfficeId }) => conductingOfficeId === handlingOfficeId,
    );

  return finished ? 'RETURNS_TO_STATION' : 'BLOCKS_MOVE';
}

// A report can only be submitted or approved once the investigation has
// a classification and cause other than UNDER_INVESTIGATION.
export function assertInvestigationConcluded(investigation: {
  classification: FireCaseClassification | null;
  causeOfFire: CauseOfFire | null;
}): void {
  if (
    !investigation.classification ||
    investigation.classification ===
      FireCaseClassification.UNDER_INVESTIGATION ||
    !investigation.causeOfFire ||
    investigation.causeOfFire === CauseOfFire.UNDER_INVESTIGATION
  ) {
    throw new BadRequestException(
      'Set the classification and cause of fire (not UNDER_INVESTIGATION) first.',
    );
  }
}

// A case with no open investigation waits on its handling office's decision
// until that office starts an investigation. A referral to the office after
// its last investigation hands the case back for a new decision.
export function awaitsDecision(
  lastStartedHere: Date | null,
  lastReferredHere: Date | null,
): boolean {
  if (!lastStartedHere) return true;
  return lastReferredHere !== null && lastReferredHere > lastStartedHere;
}

// <caseNo>-<NN>: NN counts the case's investigations from 01.
export function investigationNumber(
  caseNo: string,
  existingInvestigations: number,
): string {
  const sequence = String(existingInvestigations + 1).padStart(2, '0');
  return `${caseNo}-${sequence}`;
}
