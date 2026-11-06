import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UUID } from 'crypto';
import { ROLE } from '../../../generated/prisma/enums.js';
import { CurrentUserJwtPayload } from '../../../types/jwt.payload.js';
import { UsersRepository } from '../users.repository.js';
import { OfficeAuthorizationService } from '../../office/services/office.authorization.service.js';
import { rolePermissions } from '../utils/users.permissions.js';

const USER_SCOPE_MESSAGE = 'You can only manage users within your own region';

@Injectable()
export class UsersAuthorizationService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly officeAuthorizationService: OfficeAuthorizationService,
  ) {}

  // An admin may only manage users whose current role they could grant;
  // SUPER_ADMIN may additionally manage the SUPER_ADMIN account.
  // Returns the target's current role and office, which callers need to
  // compare against the change they are about to make.
  async assertCanManageUser(userId: UUID, currentUser: CurrentUserJwtPayload) {
    const target = await this.usersRepository.findUserRoleById(userId);

    if (!target) {
      throw new NotFoundException('User not found.');
    }

    const canManage =
      rolePermissions[currentUser.role]?.includes(target.role) ||
      (currentUser.role === ROLE.SUPER_ADMIN &&
        target.role === ROLE.SUPER_ADMIN);

    if (!canManage) {
      throw new ForbiddenException(
        `${currentUser.role} is not allowed to manage a user with role ${target.role}`,
      );
    }

    this.officeAuthorizationService.assertOfficeInScope(
      currentUser,
      target.office,
      USER_SCOPE_MESSAGE,
    );

    return target;
  }
}
