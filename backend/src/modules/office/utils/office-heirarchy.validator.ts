import { BadRequestException } from '@nestjs/common';
import { OfficeType } from '../../../generated/prisma/enums.js';

const allowedParentTypes: Record<OfficeType, OfficeType[]> = {
  [OfficeType.NATIONAL_HEADQUARTERS]: [],

  [OfficeType.REGIONAL_OFFICE]: [OfficeType.NATIONAL_HEADQUARTERS],

  [OfficeType.DISTRICT_FIRE_STATION]: [OfficeType.REGIONAL_OFFICE],

  [OfficeType.PROVINCIAL_FIRE_STATION]: [OfficeType.REGIONAL_OFFICE],

  [OfficeType.CITY_FIRE_STATION]: [
    OfficeType.DISTRICT_FIRE_STATION,
    OfficeType.PROVINCIAL_FIRE_STATION,
  ],

  [OfficeType.MUNICIPAL_FIRE_STATION]: [
    OfficeType.DISTRICT_FIRE_STATION,
    OfficeType.PROVINCIAL_FIRE_STATION,
  ],
};

export function validateOfficeHierarchy(
  type: OfficeType,
  parentType?: OfficeType,
) {
  const allowedParents = allowedParentTypes[type];

  // NHQ cannot have a parent
  if (allowedParents.length === 0) {
    if (parentType) {
      throw new BadRequestException(
        'National Headquarters cannot have a parent office',
      );
    }

    return;
  }

  // All other office types require a parent
  if (!parentType) {
    throw new BadRequestException(
      `${formatOfficeType(type)} must have a parent office`,
    );
  }

  // Validate parent type
  if (!allowedParents.includes(parentType)) {
    throw new BadRequestException(
      `${formatOfficeType(type)} must have one of the following as its parent: ${allowedParents
        .map(formatOfficeType)
        .join(', ')}`,
    );
  }
}

function formatOfficeType(type: OfficeType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
