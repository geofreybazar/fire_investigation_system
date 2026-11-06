import { BadRequestException } from '@nestjs/common';
import { OfficeType } from '../../../generated/prisma/enums.js';

// Stored trimmed and upper-cased to match generateCaseNumber; blank
// (non-regional offices) is stored as null so the unique index allows many.
export function normalizeRegionCode(regionCode?: string | null): string | null {
  return regionCode?.trim().toUpperCase() || null;
}

export function validateRegionCode(
  type: OfficeType,
  regionCode?: string | null,
): void {
  if (type === 'REGIONAL_OFFICE') {
    if (!regionCode?.trim()) {
      throw new BadRequestException(
        'A region code is required for regional offices',
      );
    }

    return;
  }

  if (regionCode?.trim()) {
    throw new BadRequestException(
      'A region code is only allowed for regional offices',
    );
  }
}
