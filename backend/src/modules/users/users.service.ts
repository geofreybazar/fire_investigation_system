import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { UsersRepository } from './users.repository.js';
import { UsersAuthorizationService } from './service/users.authorization.service.js';
import { OfficeRepository } from '../office/office.repository.js';

import {
  ChangePasswordInput,
  ChangeUserStatusInput,
  UserInput,
} from './schema/user.schema.js';

import bcrypt from 'bcrypt';
import { UUID } from 'crypto';

import { RANK, ROLE } from '../../generated/prisma/enums.js';
import { rolePermissions } from './utils/users.permissions.js';
import { role_officePermissions } from './utils/users.role_office.permissions.js';
import { OfficeAuthorizationService } from '../office/services/office.authorization.service.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';

// Station roles the system can't work without (FR-USR-015). Losing the last
// active one is allowed, but the admin is warned about the consequence.
const STATION_LEADER_ROLES: Partial<Record<ROLE, string>> = {
  [ROLE.CITY_MUNICIPALITY_CHIEF_INVESTIGATOR]:
    'chief investigator, so its investigation cases cannot be decided until one is assigned',
};

const USER_SCOPE_MESSAGE = 'You can only manage users within your own region';

const ADMIN_ROLES: ROLE[] = [
  ROLE.SUPER_ADMIN,
  ROLE.NHQ_ADMIN,
  ROLE.REGIONAL_ADMIN,
];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private usersRepository: UsersRepository,
    private officeRepository: OfficeRepository,
    private configService: ConfigService,
    private officeAuthorizationService: OfficeAuthorizationService,
    private usersAuthorizationService: UsersAuthorizationService,
  ) {}

  async createUser(userData: UserInput, user: CurrentUserJwtPayload) {
    this.logger.log(`Creating user: ${userData.email}`);

    // check allowed role creation by user role
    const allowedRoles = rolePermissions[user.role];

    if (!allowedRoles?.includes(userData.role)) {
      throw new ForbiddenException(
        `${user.role} is not allowed to create a user with role ${userData.role}`,
      );
    }

    // check allow role to office permission
    const allowedOfficeTypes = role_officePermissions[userData.role];

    const office = await this.officeRepository.findById(userData.officeId);

    if (!office) {
      throw new NotFoundException('Selected office not found');
    }

    if (!allowedOfficeTypes.includes(office.type)) {
      throw new ForbiddenException(
        `Role ${userData.role} cannot be assigned to ${office.type}`,
      );
    }

    this.officeAuthorizationService.assertOfficeInScope(
      user,
      office,
      USER_SCOPE_MESSAGE,
    );

    const defaultPassword = this.configService.get<string>(
      'defaultPassword',
    ) as string;

    const saltRound = 10;

    const passwordHash = await bcrypt.hash(defaultPassword, saltRound);

    // create new user
    const newUser = await this.usersRepository.createUser(
      passwordHash,
      userData,
      user.sub,
    );

    this.logger.log(`User created: ${newUser.id}`);

    return newUser;
  }

  // Users may read their own profile; admins may read users in their scope.
  async getUser(userId: UUID, currentUser: CurrentUserJwtPayload) {
    const isSelf = userId === currentUser.sub;
    const isNationalAdmin =
      currentUser.role === ROLE.SUPER_ADMIN ||
      currentUser.role === ROLE.NHQ_ADMIN;

    // Reject before the lookup so non-admins can't probe which ids exist.
    if (
      !isSelf &&
      !isNationalAdmin &&
      currentUser.role !== ROLE.REGIONAL_ADMIN
    ) {
      throw new ForbiddenException('You are not allowed to view this user.');
    }

    const user = await this.usersRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isInRegion =
      user.officeId === currentUser.officeId ||
      user.office.regionId === currentUser.officeId;

    if (!isSelf && !isNationalAdmin && !isInRegion) {
      throw new ForbiddenException('You are not allowed to view this user.');
    }

    const { password, failedLoginCount, lockedUntil, ...safeUser } = user;
    return safeUser;
  }

  async changePassword(passwordData: ChangePasswordInput, userId: UUID) {
    const { currentPassword, newPassword } = passwordData;

    // find user
    const user = await this.usersRepository.findUserForChangePassword(userId);

    // check if user entered valid old pasword
    const passwordCorrect =
      user === null
        ? false
        : await bcrypt.compare(currentPassword, user.password);

    if (!user || !passwordCorrect) {
      this.logger.warn(`Password change failed for account: ${userId}`);
    }

    if (!user) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Not 401: the frontend treats Unauthorized as a dead session and logs out.
    if (!passwordCorrect) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException(
        'The new password must be different from the current one.',
      );
    }

    const saltRound = 10;

    const passwordHash = await bcrypt.hash(newPassword, saltRound);

    // store new password
    const returnedUser = await this.usersRepository.changePassowrd(
      passwordHash,
      userId,
    );

    return;
  }

  async findPaginatedUsers(
    currentUser: CurrentUserJwtPayload,
    page: number,
    search: string,
    officeId: UUID,
    status: 'Active' | 'Inactive',
    rank?: RANK,
  ) {
    if (!ADMIN_ROLES.includes(currentUser.role)) {
      throw new ForbiddenException('You are not allowed to list users.');
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    const { personnel, total } = await this.usersRepository.findPaginatedUsers(
      currentUser,
      search,
      officeId,
      limit,
      skip,
      status,
      rank,
    );

    return {
      data: personnel,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async changeUserStatus(
    userId: UUID,
    isActive: ChangeUserStatusInput,
    currentUser: CurrentUserJwtPayload,
  ) {
    if (!isActive.isActive && userId === currentUser.sub) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    const target = await this.usersAuthorizationService.assertCanManageUser(
      userId,
      currentUser,
    );

    if (!isActive.isActive) {
      await this.assertNoOpenInvestigation(userId);
    }

    const user = await this.usersRepository.deactivateUser(
      userId,
      isActive.isActive,
      currentUser.sub,
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const warning = isActive.isActive
      ? undefined
      : await this.stationLeaderWarning(target.role, target.office.id);

    return {
      message: isActive.isActive
        ? 'User activated successfully.'
        : 'User deactivated successfully.',
      ...(warning && { warning }),
    };
  }

  async editUser(
    userId: UUID,
    userData: UserInput,
    user: CurrentUserJwtPayload,
  ) {
    this.logger.log(`Creating user: ${userData.email}`);

    const target = await this.usersAuthorizationService.assertCanManageUser(
      userId,
      user,
    );
    const targetRole = target.role;

    // The SUPER_ADMIN account keeps its role: the API can neither grant nor remove it.
    if (targetRole === ROLE.SUPER_ADMIN || userData.role === ROLE.SUPER_ADMIN) {
      if (targetRole !== userData.role) {
        throw new ForbiddenException(
          'The SUPER_ADMIN role cannot be granted or removed through the API',
        );
      }
    } else {
      // check allowed role creation by user role
      const allowedRoles = rolePermissions[user.role];

      if (!allowedRoles?.includes(userData.role)) {
        throw new ForbiddenException(
          `${user.role} is not allowed to assign a user with role ${userData.role}`,
        );
      }
    }

    // check allow role to office permission
    const allowedOfficeTypes = role_officePermissions[userData.role];

    const office = await this.officeRepository.findById(userData.officeId);

    if (!office) {
      throw new NotFoundException('Selected office not found');
    }

    if (!allowedOfficeTypes.includes(office.type)) {
      throw new ForbiddenException(
        `Role ${userData.role} cannot be assigned to ${office.type}`,
      );
    }

    this.officeAuthorizationService.assertOfficeInScope(
      user,
      office,
      USER_SCOPE_MESSAGE,
    );

    await this.assertNoOpenInvestigation(userId);

    // edit user info
    const editedUser = await this.usersRepository.editUser(
      userId,
      userData,
      user.sub,
    );

    if (!editedUser) {
      throw new NotFoundException('for editing user cannot found');
    }

    this.logger.log(`User edited: ${editedUser.id}`);

    const leftOldRole =
      targetRole !== userData.role || target.office.id !== userData.officeId;
    const warning = leftOldRole
      ? await this.stationLeaderWarning(targetRole, target.office.id)
      : undefined;

    return {
      message: 'user successfully updated',
      ...(warning && { warning }),
    };
  }

  // Called after the change, so the count no longer includes the edited user.
  private async stationLeaderWarning(role: ROLE, officeId: string) {
    const consequence = STATION_LEADER_ROLES[role];

    if (!consequence) {
      return undefined;
    }

    const remaining = await this.usersRepository.countActiveUsersWithRole(
      officeId,
      role,
    );

    if (remaining > 0) {
      return undefined;
    }

    const office = await this.officeRepository.findById(officeId);

    return `${office?.name ?? 'The station'} now has no active ${consequence}.`;
  }

  // An investigator with an open investigation can't be deactivated, moved or
  // edited until it is finished (FR-USR-013/014).
  private async assertNoOpenInvestigation(userId: UUID) {
    const open =
      await this.usersRepository.countOpenAssignedInvestigations(userId);

    if (open > 0) {
      throw new ConflictException(
        'This user has an open investigation and cannot be changed until it is finished.',
      );
    }
  }
}
