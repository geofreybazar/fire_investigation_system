import { BadRequestException } from '@nestjs/common';
import { OfficeType } from '../../../generated/prisma/enums.js';
import {
  assertInvestigationConcluded,
  awaitsDecision,
  caseAfterStationMove,
  investigationNumber,
  referralDirection,
  referralTargets,
  stationChain,
  type StationWithAncestors,
} from './investigation-rules.js';

const station: StationWithAncestors = {
  id: 'station',
  name: 'Quezon City Fire Station',
  type: 'CITY_FIRE_STATION',
  parent: {
    id: 'district',
    name: 'QC District',
    type: 'DISTRICT_FIRE_STATION',
  },
  region: {
    id: 'region',
    name: 'NCR',
    type: 'REGIONAL_OFFICE',
    parent: { id: 'nhq', name: 'NHQ', type: 'NATIONAL_HEADQUARTERS' },
  },
};

const chain = stationChain(station);

describe('investigation rules', () => {
  it('builds the chain lowest first: station, district, region, NHQ', () => {
    expect(chain.map((office) => office.id)).toEqual([
      'station',
      'district',
      'region',
      'nhq',
    ]);
  });

  describe('referralDirection', () => {
    it('allows referring up to any office above, skipping levels', () => {
      expect(referralDirection(chain, 'station', 'district')).toBe('UP');
      expect(referralDirection(chain, 'station', 'nhq')).toBe('UP');
    });

    it('allows referring down to any office below in the chain', () => {
      expect(referralDirection(chain, 'nhq', 'station')).toBe('DOWN');
      expect(referralDirection(chain, 'region', 'district')).toBe('DOWN');
    });

    it('rejects an office outside the chain', () => {
      expect(() => referralDirection(chain, 'station', 'other-region')).toThrow(
        BadRequestException,
      );
    });

    it('rejects referring to the same office', () => {
      expect(() => referralDirection(chain, 'region', 'region')).toThrow(
        'The case is already handled by that office.',
      );
    });
  });

  it('lists the referral targets with their direction', () => {
    expect(
      referralTargets(chain, 'district').map(({ id, direction }) => [
        id,
        direction,
      ]),
    ).toEqual([
      ['station', 'DOWN'],
      ['region', 'UP'],
      ['nhq', 'UP'],
    ]);
  });

  describe('assertInvestigationConcluded', () => {
    it('requires both classification and cause, and neither UNDER_INVESTIGATION', () => {
      expect(() =>
        assertInvestigationConcluded({
          classification: 'ACCIDENTAL',
          causeOfFire: 'OVERHEATED_HOME_APPLIANCES',
        }),
      ).not.toThrow();

      for (const investigation of [
        { classification: null, causeOfFire: 'OVERHEATED_HOME_APPLIANCES' },
        { classification: 'ACCIDENTAL', causeOfFire: null },
        {
          classification: 'UNDER_INVESTIGATION',
          causeOfFire: 'OVERHEATED_HOME_APPLIANCES',
        },
        { classification: 'ACCIDENTAL', causeOfFire: 'UNDER_INVESTIGATION' },
      ] as Parameters<typeof assertInvestigationConcluded>[0][]) {
        expect(() => assertInvestigationConcluded(investigation)).toThrow(
          BadRequestException,
        );
      }
    });
  });

  it('numbers investigations from 01 per incident', () => {
    expect(investigationNumber('INV-2026-10-NCR-000123', 0)).toBe(
      'INV-2026-10-NCR-000123-01',
    );
    expect(investigationNumber('INV-2026-10-NCR-000123', 1)).toBe(
      'INV-2026-10-NCR-000123-02',
    );
  });
});

describe('caseAfterStationMove (Q-51)', () => {
  const chain = [
    { id: 'station', name: 'Station', type: OfficeType.CITY_FIRE_STATION },
    { id: 'new-district', name: 'New', type: OfficeType.DISTRICT_FIRE_STATION },
  ];
  const completed = (conductingOfficeId: string) => ({
    conductingOfficeId,
    completedAt: new Date(),
  });
  const open = (conductingOfficeId: string) => ({
    conductingOfficeId,
    completedAt: null,
  });

  it('leaves a case handled inside the new chain alone', () => {
    expect(
      caseAfterStationMove(chain, 'new-district', [open('new-district')]),
    ).toBe('STAYS');
  });

  it('blocks the move for an open investigation outside the chain', () => {
    expect(
      caseAfterStationMove(chain, 'old-district', [open('old-district')]),
    ).toBe('BLOCKS_MOVE');
  });

  it('blocks the move for a referred case with no investigation yet', () => {
    expect(caseAfterStationMove(chain, 'old-district', [])).toBe('BLOCKS_MOVE');
  });

  it('blocks when only a different office has completed an investigation', () => {
    expect(
      caseAfterStationMove(chain, 'old-district', [completed('station')]),
    ).toBe('BLOCKS_MOVE');
  });

  it('returns a completed case to the station', () => {
    expect(
      caseAfterStationMove(chain, 'old-district', [completed('old-district')]),
    ).toBe('RETURNS_TO_STATION');
  });
});

describe('awaitsDecision', () => {
  const jan = new Date('2026-01-01T00:00:00Z');
  const feb = new Date('2026-02-01T00:00:00Z');

  it('waits when the office never started an investigation', () => {
    expect(awaitsDecision(null, null)).toBe(true);
    expect(awaitsDecision(null, jan)).toBe(true);
  });

  it('stops waiting once the office has investigated', () => {
    expect(awaitsDecision(jan, null)).toBe(false);
    expect(awaitsDecision(feb, jan)).toBe(false);
  });

  it('waits again when the case is referred back after that', () => {
    expect(awaitsDecision(jan, feb)).toBe(true);
  });
});
