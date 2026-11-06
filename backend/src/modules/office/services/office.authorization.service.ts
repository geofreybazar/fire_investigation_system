import { ForbiddenException, Injectable } from '@nestjs/common';
import { OfficeType, ROLE } from '../../../generated/prisma/enums.js';
import { officePermissions } from '../utils/office.permissions.js';
import { CurrentUserJwtPayload } from '../../../types/jwt.payload.js';

@Injectable()
export class OfficeAuthorizationService {
  canManageOffice(user: CurrentUserJwtPayload, officeType: OfficeType): void {
    const allowedOfficeTypes = officePermissions[user.role];

    if (!allowedOfficeTypes?.includes(officeType)) {
      throw new ForbiddenException(
        `${user.role} is not allowed to manage a ${officeType}`,
      );
    }
  }

  // Fails closed: only the roles named here pass.
  assertOfficeInScope(
    user: CurrentUserJwtPayload,
    office: { id: string; regionId: string | null },
    message = 'You can only manage offices within your own region',
  ): void {
    // National admins work nationwide.
    if (user.role === ROLE.SUPER_ADMIN || user.role === ROLE.NHQ_ADMIN) {
      return;
    }

    // Regional admins are limited to their own office and its region.
    if (
      user.role === ROLE.REGIONAL_ADMIN &&
      (office.id === user.officeId || office.regionId === user.officeId)
    ) {
      return;
    }

    // Every other role, or a regional admin outside their region.
    throw new ForbiddenException(message);
  }
}
