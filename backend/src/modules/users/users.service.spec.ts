import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { type UUID } from 'crypto';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { OfficeRepository } from '../office/office.repository.js';
import { OfficeAuthorizationService } from '../office/services/office.authorization.service.js';
import { UsersAuthorizationService } from './service/users.authorization.service.js';
import { type UserInput } from './schema/user.schema.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

const userId = '11111111-1111-4111-8111-111111111111' as UUID;
const officeId = '22222222-2222-4222-8222-222222222222';

const superAdmin: CurrentUserJwtPayload = {
  sub: '33333333-3333-4333-8333-333333333333' as UUID,
  account_number: 'ADMIN001',
  role: 'SUPER_ADMIN',
  positionId: 'position-1',
  officeId: 'nhq-office',
};

// The regional admin's own office is `officeId` (a regional office).
const regionalAdmin: CurrentUserJwtPayload = {
  ...superAdmin,
  role: 'REGIONAL_ADMIN',
  officeId,
};

const otherRegionOffice = {
  id: '66666666-6666-4666-8666-666666666666',
  type: 'REGIONAL_OFFICE',
  regionId: null,
};

const nhqAdmin: CurrentUserJwtPayload = {
  ...superAdmin,
  role: 'NHQ_ADMIN',
};

const newInvestigator = {
  account_number: 'INV001',
  rank: 'FO2',
  first_name: 'Juan',
  last_name: 'Dela Cruz',
  email: 'juan@example.com',
  role: 'REGIONAL_INVESTIGATOR',
  officeId,
  positionId: '44444444-4444-4444-8444-444444444444',
} as UserInput;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    createUser: ReturnType<typeof vi.fn>;
    findUserById: ReturnType<typeof vi.fn>;
    findUserRoleById: ReturnType<typeof vi.fn>;
    countOpenAssignedInvestigations: ReturnType<typeof vi.fn>;
    findUserForChangePassword: ReturnType<typeof vi.fn>;
    changePassowrd: ReturnType<typeof vi.fn>;
    findPaginatedUsers: ReturnType<typeof vi.fn>;
    deactivateUser: ReturnType<typeof vi.fn>;
    editUser: ReturnType<typeof vi.fn>;
    countActiveUsersWithRole: ReturnType<typeof vi.fn>;
  };
  let officeRepository: { findById: ReturnType<typeof vi.fn> };
  let configService: { get: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.mocked(bcrypt.hash).mockReset();
    vi.mocked(bcrypt.compare).mockReset();

    usersRepository = {
      createUser: vi.fn(),
      findUserById: vi.fn(),
      // By default the target user is an ordinary investigator in `officeId`.
      findUserRoleById: vi.fn().mockResolvedValue({
        id: userId,
        role: 'REGIONAL_INVESTIGATOR',
        office: { id: officeId, regionId: null },
      }),
      // By default the user has no open investigation.
      countOpenAssignedInvestigations: vi.fn().mockResolvedValue(0),
      findUserForChangePassword: vi.fn(),
      changePassowrd: vi.fn(),
      findPaginatedUsers: vi.fn(),
      deactivateUser: vi.fn(),
      editUser: vi.fn(),
      // By default other users with the same role remain.
      countActiveUsersWithRole: vi.fn().mockResolvedValue(1),
    };
    officeRepository = { findById: vi.fn() };
    configService = { get: vi.fn().mockReturnValue('DefaultPass123!') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: OfficeRepository, useValue: officeRepository },
        { provide: ConfigService, useValue: configService },
        // Real service, so the region rules are exercised with the user rules.
        OfficeAuthorizationService,
        UsersAuthorizationService,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('hashes the default password and creates the user', async () => {
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'REGIONAL_OFFICE',
      });
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-default' as never);
      const created = { id: userId, ...newInvestigator };
      usersRepository.createUser.mockResolvedValue(created);

      await expect(
        service.createUser(newInvestigator, superAdmin),
      ).resolves.toBe(created);
      expect(configService.get).toHaveBeenCalledWith('defaultPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('DefaultPass123!', 10);
      expect(usersRepository.createUser).toHaveBeenCalledWith(
        'hashed-default',
        newInvestigator,
        superAdmin.sub,
      );
    });

    it('forbids creating a role the current user cannot assign', async () => {
      await expect(
        service.createUser(
          { ...newInvestigator, role: 'NHQ_ADMIN' },
          regionalAdmin,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(officeRepository.findById).not.toHaveBeenCalled();
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('forbids non-admin users from creating anyone', async () => {
      await expect(
        service.createUser(newInvestigator, {
          ...superAdmin,
          role: 'REGIONAL_INVESTIGATOR',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it.each([
      ['SUPER_ADMIN', superAdmin],
      ['NHQ_ADMIN', nhqAdmin],
      ['REGIONAL_ADMIN', regionalAdmin],
    ])('forbids %s from creating a SUPER_ADMIN', async (_role, actor) => {
      await expect(
        service.createUser({ ...newInvestigator, role: 'SUPER_ADMIN' }, actor),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from creating a REGIONAL_ADMIN', async () => {
      await expect(
        service.createUser(
          { ...newInvestigator, role: 'REGIONAL_ADMIN' },
          regionalAdmin,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('allows NHQ_ADMIN to create a REGIONAL_ADMIN', async () => {
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'REGIONAL_OFFICE',
      });
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-default' as never);
      usersRepository.createUser.mockResolvedValue({ id: userId });

      await expect(
        service.createUser(
          { ...newInvestigator, role: 'REGIONAL_ADMIN' },
          nhqAdmin,
        ),
      ).resolves.toEqual({ id: userId });
    });

    it('allows REGIONAL_ADMIN to create a user in a station of their region', async () => {
      officeRepository.findById.mockResolvedValue({
        id: 'station-1',
        type: 'CITY_FIRE_STATION',
        regionId: officeId,
      });
      usersRepository.createUser.mockResolvedValue({ id: userId });

      await expect(
        service.createUser(
          { ...newInvestigator, role: 'CITY_MUNICIPALITY_INVESTIGATOR' },
          regionalAdmin,
        ),
      ).resolves.toEqual({ id: userId });
    });

    it('forbids REGIONAL_ADMIN from creating a user in another region', async () => {
      officeRepository.findById.mockResolvedValue(otherRegionOffice);

      await expect(
        service.createUser(newInvestigator, regionalAdmin),
      ).rejects.toThrow('You can only manage users within your own region');
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the office does not exist', async () => {
      officeRepository.findById.mockResolvedValue(null);

      await expect(
        service.createUser(newInvestigator, superAdmin),
      ).rejects.toThrow(NotFoundException);
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('forbids assigning the role to an office of the wrong type', async () => {
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'CITY_FIRE_STATION',
      });

      await expect(
        service.createUser(newInvestigator, superAdmin),
      ).rejects.toThrow(
        'Role REGIONAL_INVESTIGATOR cannot be assigned to CITY_FIRE_STATION',
      );
      expect(usersRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    const investigator: CurrentUserJwtPayload = {
      ...superAdmin,
      sub: userId,
      role: 'REGIONAL_INVESTIGATOR',
      officeId,
    };
    const storedUser = (office: { id: string; regionId: string | null }) => ({
      id: userId,
      email: 'juan@example.com',
      password: 'secret-hash',
      officeId: office.id,
      office,
    });

    it('returns the user without the password', async () => {
      usersRepository.findUserById.mockResolvedValue(
        storedUser({ id: officeId, regionId: null }),
      );

      const result = await service.getUser(userId, investigator);

      expect(result).toEqual({
        id: userId,
        email: 'juan@example.com',
        officeId,
        office: { id: officeId, regionId: null },
      });
      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findUserById.mockResolvedValue(null);

      await expect(service.getUser(userId, superAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('forbids a non-admin from reading another user, without looking them up', async () => {
      await expect(
        service.getUser(userId, {
          ...investigator,
          sub: '55555555-5555-4555-8555-555555555555' as UUID,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.findUserById).not.toHaveBeenCalled();
    });

    it('allows NHQ_ADMIN to read any user', async () => {
      usersRepository.findUserById.mockResolvedValue(
        storedUser({ id: 'other-region-station', regionId: 'other-region' }),
      );

      await expect(service.getUser(userId, nhqAdmin)).resolves.toMatchObject({
        id: userId,
      });
    });

    it.each([
      ['their own office', { id: 'regional-office', regionId: null }],
      [
        'a station in their region',
        { id: 'station-1', regionId: 'regional-office' },
      ],
    ])('allows REGIONAL_ADMIN to read a user in %s', async (_label, office) => {
      usersRepository.findUserById.mockResolvedValue(storedUser(office));

      await expect(
        service.getUser(userId, {
          ...regionalAdmin,
          officeId: 'regional-office',
        }),
      ).resolves.toMatchObject({ id: userId });
    });

    it('forbids REGIONAL_ADMIN from reading a user outside their region', async () => {
      usersRepository.findUserById.mockResolvedValue(
        storedUser({ id: 'station-2', regionId: 'other-region' }),
      );

      await expect(
        service.getUser(userId, {
          ...regionalAdmin,
          officeId: 'regional-office',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
    };

    it('stores a hash of the new password when the current one matches', async () => {
      usersRepository.findUserForChangePassword.mockResolvedValue({
        id: userId,
        password: 'old-hash',
      });
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

      await expect(
        service.changePassword(passwordData, userId),
      ).resolves.toBeUndefined();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'OldPassword123!',
        'old-hash',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456!', 10);
      expect(usersRepository.changePassowrd).toHaveBeenCalledWith(
        'new-hash',
        userId,
      );
    });

    it('refuses a new password equal to the current one', async () => {
      usersRepository.findUserForChangePassword.mockResolvedValue({
        id: userId,
        password: 'old-hash',
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        service.changePassword(passwordData, userId),
      ).rejects.toThrow('different from the current one');
      expect(usersRepository.changePassowrd).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the current password is wrong', async () => {
      usersRepository.findUserForChangePassword.mockResolvedValue({
        id: userId,
        password: 'old-hash',
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.changePassword(passwordData, userId),
      ).rejects.toThrow(BadRequestException);
      expect(usersRepository.changePassowrd).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersRepository.findUserForChangePassword.mockResolvedValue(null);

      await expect(
        service.changePassword(passwordData, userId),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(usersRepository.changePassowrd).not.toHaveBeenCalled();
    });
  });

  describe('findPaginatedUsers', () => {
    it('computes skip from page and returns pagination metadata', async () => {
      const personnel = [{ id: userId }];
      usersRepository.findPaginatedUsers.mockResolvedValue({
        personnel,
        total: 21,
      });

      const result = await service.findPaginatedUsers(
        regionalAdmin,
        3,
        'juan',
        officeId as UUID,
        'Active',
        'FO2',
      );

      expect(usersRepository.findPaginatedUsers).toHaveBeenCalledWith(
        regionalAdmin,
        'juan',
        officeId,
        10,
        20,
        'Active',
        'FO2',
      );
      expect(result).toEqual({
        data: personnel,
        pagination: { page: 3, limit: 10, total: 21, totalPages: 3 },
      });
    });

    it('forbids non-admin roles from listing users', async () => {
      await expect(
        service.findPaginatedUsers(
          { ...superAdmin, role: 'REGIONAL_INVESTIGATOR' },
          1,
          '',
          '' as UUID,
          'Active',
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.findPaginatedUsers).not.toHaveBeenCalled();
    });
  });

  describe('changeUserStatus', () => {
    it('reports activation when isActive is true', async () => {
      usersRepository.deactivateUser.mockResolvedValue({ id: userId });

      await expect(
        service.changeUserStatus(userId, { isActive: true }, superAdmin),
      ).resolves.toEqual({ message: 'User activated successfully.' });
      expect(usersRepository.deactivateUser).toHaveBeenCalledWith(
        userId,
        true,
        superAdmin.sub,
      );
    });

    it('reports deactivation when isActive is false', async () => {
      usersRepository.deactivateUser.mockResolvedValue({ id: userId });

      await expect(
        service.changeUserStatus(userId, { isActive: false }, superAdmin),
      ).resolves.toEqual({ message: 'User deactivated successfully.' });
      expect(usersRepository.deactivateUser).toHaveBeenCalledWith(
        userId,
        false,
        superAdmin.sub,
      );
    });

    describe('station leader warning (FR-USR-015)', () => {
      beforeEach(() => {
        usersRepository.findUserRoleById.mockResolvedValue({
          id: userId,
          role: 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR',
          office: { id: officeId, regionId: null },
        });
        usersRepository.deactivateUser.mockResolvedValue({ id: userId });
        officeRepository.findById.mockResolvedValue({
          id: officeId,
          name: 'Quezon City Fire Station',
        });
      });

      it('warns when the last active chief investigator is deactivated', async () => {
        usersRepository.countActiveUsersWithRole.mockResolvedValue(0);

        await expect(
          service.changeUserStatus(userId, { isActive: false }, superAdmin),
        ).resolves.toEqual({
          message: 'User deactivated successfully.',
          warning:
            'Quezon City Fire Station now has no active chief investigator, so its investigation cases cannot be decided until one is assigned.',
        });
        expect(usersRepository.countActiveUsersWithRole).toHaveBeenCalledWith(
          officeId,
          'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR',
        );
      });

      it('does not warn while another chief investigator remains', async () => {
        await expect(
          service.changeUserStatus(userId, { isActive: false }, superAdmin),
        ).resolves.toEqual({ message: 'User deactivated successfully.' });
      });

      it('does not warn on activation', async () => {
        usersRepository.countActiveUsersWithRole.mockResolvedValue(0);

        await expect(
          service.changeUserStatus(userId, { isActive: true }, superAdmin),
        ).resolves.toEqual({ message: 'User activated successfully.' });
        expect(usersRepository.countActiveUsersWithRole).not.toHaveBeenCalled();
      });
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findUserRoleById.mockResolvedValue(null);

      await expect(
        service.changeUserStatus(userId, { isActive: true }, superAdmin),
      ).rejects.toThrow(NotFoundException);
      expect(usersRepository.deactivateUser).not.toHaveBeenCalled();
    });

    it('forbids an admin from deactivating their own account', async () => {
      await expect(
        service.changeUserStatus(nhqAdmin.sub, { isActive: false }, nhqAdmin),
      ).rejects.toThrow('You cannot deactivate your own account.');
      expect(usersRepository.deactivateUser).not.toHaveBeenCalled();
    });

    it.each([
      ['NHQ_ADMIN', 'SUPER_ADMIN', nhqAdmin],
      ['REGIONAL_ADMIN', 'SUPER_ADMIN', regionalAdmin],
      ['REGIONAL_ADMIN', 'NHQ_ADMIN', regionalAdmin],
      ['REGIONAL_ADMIN', 'REGIONAL_ADMIN', regionalAdmin],
    ])(
      'forbids %s from deactivating a %s',
      async (_role, targetRole, actor) => {
        usersRepository.findUserRoleById.mockResolvedValue({
          id: userId,
          role: targetRole,
        });

        await expect(
          service.changeUserStatus(userId, { isActive: false }, actor),
        ).rejects.toThrow(ForbiddenException);
        expect(usersRepository.deactivateUser).not.toHaveBeenCalled();
      },
    );

    it('forbids REGIONAL_ADMIN from deactivating a user in another region', async () => {
      usersRepository.findUserRoleById.mockResolvedValue({
        id: userId,
        role: 'CITY_MUNICIPALITY_INVESTIGATOR',
        office: { id: 'station-9', regionId: otherRegionOffice.id },
      });

      await expect(
        service.changeUserStatus(userId, { isActive: false }, regionalAdmin),
      ).rejects.toThrow('You can only manage users within your own region');
      expect(usersRepository.deactivateUser).not.toHaveBeenCalled();
    });

    it('forbids deactivating an investigator with an open investigation', async () => {
      usersRepository.countOpenAssignedInvestigations.mockResolvedValue(1);

      await expect(
        service.changeUserStatus(userId, { isActive: false }, superAdmin),
      ).rejects.toThrow(ConflictException);
      expect(usersRepository.deactivateUser).not.toHaveBeenCalled();
    });

    it('still allows activating an investigator with an open investigation', async () => {
      usersRepository.countOpenAssignedInvestigations.mockResolvedValue(1);
      usersRepository.deactivateUser.mockResolvedValue({ id: userId });

      await expect(
        service.changeUserStatus(userId, { isActive: true }, superAdmin),
      ).resolves.toEqual({ message: 'User activated successfully.' });
    });

    it('allows REGIONAL_ADMIN to deactivate a user whose role they can grant', async () => {
      usersRepository.deactivateUser.mockResolvedValue({ id: userId });

      await expect(
        service.changeUserStatus(userId, { isActive: false }, regionalAdmin),
      ).resolves.toEqual({ message: 'User deactivated successfully.' });
    });
  });

  describe('editUser', () => {
    it('warns when the last chief investigator of a station changes role', async () => {
      usersRepository.findUserRoleById.mockResolvedValue({
        id: userId,
        role: 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR',
        office: { id: officeId, regionId: null },
      });
      usersRepository.countActiveUsersWithRole.mockResolvedValue(0);
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        name: 'Quezon City Fire Station',
        type: 'CITY_FIRE_STATION',
      });
      usersRepository.editUser.mockResolvedValue({ id: userId });

      await expect(
        service.editUser(
          userId,
          { ...newInvestigator, role: 'CITY_MUNICIPALITY_INVESTIGATOR' },
          superAdmin,
        ),
      ).resolves.toEqual({
        message: 'user successfully updated',
        warning:
          'Quezon City Fire Station now has no active chief investigator, so its investigation cases cannot be decided until one is assigned.',
      });
    });

    it('edits a user that passes the permission checks', async () => {
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'REGIONAL_OFFICE',
      });
      usersRepository.editUser.mockResolvedValue({ id: userId });

      await expect(
        service.editUser(userId, newInvestigator, regionalAdmin),
      ).resolves.toEqual({ message: 'user successfully updated' });
      expect(usersRepository.editUser).toHaveBeenCalledWith(
        userId,
        newInvestigator,
        regionalAdmin.sub,
      );
    });

    it('forbids assigning a role the current user cannot assign', async () => {
      await expect(
        service.editUser(
          userId,
          { ...newInvestigator, role: 'SUPER_ADMIN' },
          regionalAdmin,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the office does not exist', async () => {
      officeRepository.findById.mockResolvedValue(null);

      await expect(
        service.editUser(userId, newInvestigator, superAdmin),
      ).rejects.toThrow(NotFoundException);
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('forbids assigning the role to an office of the wrong type', async () => {
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'NATIONAL_HEADQUARTERS',
      });

      await expect(
        service.editUser(userId, newInvestigator, superAdmin),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the user does not exist', async () => {
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'REGIONAL_OFFICE',
      });
      usersRepository.editUser.mockResolvedValue(null);

      await expect(
        service.editUser(userId, newInvestigator, superAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the target user is not found', async () => {
      usersRepository.findUserRoleById.mockResolvedValue(null);

      await expect(
        service.editUser(userId, newInvestigator, superAdmin),
      ).rejects.toThrow(NotFoundException);
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it.each([
      ['NHQ_ADMIN', 'SUPER_ADMIN', nhqAdmin],
      ['REGIONAL_ADMIN', 'SUPER_ADMIN', regionalAdmin],
      ['REGIONAL_ADMIN', 'NHQ_ADMIN', regionalAdmin],
      ['REGIONAL_ADMIN', 'REGIONAL_ADMIN', regionalAdmin],
    ])('forbids %s from editing a %s', async (_role, targetRole, actor) => {
      usersRepository.findUserRoleById.mockResolvedValue({
        id: userId,
        role: targetRole,
      });

      await expect(
        service.editUser(userId, newInvestigator, actor),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('forbids editing or moving an investigator with an open investigation', async () => {
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'REGIONAL_OFFICE',
      });
      usersRepository.countOpenAssignedInvestigations.mockResolvedValue(2);

      await expect(
        service.editUser(userId, newInvestigator, superAdmin),
      ).rejects.toThrow(
        'This user has an open investigation and cannot be changed until it is finished.',
      );
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from editing a user in another region', async () => {
      usersRepository.findUserRoleById.mockResolvedValue({
        id: userId,
        role: 'REGIONAL_INVESTIGATOR',
        office: otherRegionOffice,
      });

      await expect(
        service.editUser(userId, newInvestigator, regionalAdmin),
      ).rejects.toThrow('You can only manage users within your own region');
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from moving a user into another region', async () => {
      officeRepository.findById.mockResolvedValue(otherRegionOffice);

      await expect(
        service.editUser(
          userId,
          { ...newInvestigator, officeId: otherRegionOffice.id },
          regionalAdmin,
        ),
      ).rejects.toThrow('You can only manage users within your own region');
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from promoting a user to REGIONAL_ADMIN', async () => {
      await expect(
        service.editUser(
          userId,
          { ...newInvestigator, role: 'REGIONAL_ADMIN' },
          regionalAdmin,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('forbids SUPER_ADMIN from promoting a user to SUPER_ADMIN', async () => {
      await expect(
        service.editUser(
          userId,
          { ...newInvestigator, role: 'SUPER_ADMIN' },
          superAdmin,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });

    it('allows SUPER_ADMIN to edit the SUPER_ADMIN account while keeping its role', async () => {
      usersRepository.findUserRoleById.mockResolvedValue({
        id: userId,
        role: 'SUPER_ADMIN',
        office: { id: officeId, regionId: null },
      });
      officeRepository.findById.mockResolvedValue({
        id: officeId,
        type: 'NATIONAL_HEADQUARTERS',
      });
      usersRepository.editUser.mockResolvedValue({ id: userId });
      const superAdminDetails = {
        ...newInvestigator,
        role: 'SUPER_ADMIN',
      } as UserInput;

      await expect(
        service.editUser(userId, superAdminDetails, superAdmin),
      ).resolves.toEqual({ message: 'user successfully updated' });
      expect(usersRepository.editUser).toHaveBeenCalledWith(
        userId,
        superAdminDetails,
        superAdmin.sub,
      );
    });

    it('forbids removing the SUPER_ADMIN role through the API', async () => {
      usersRepository.findUserRoleById.mockResolvedValue({
        id: userId,
        role: 'SUPER_ADMIN',
      });

      await expect(
        service.editUser(
          userId,
          { ...newInvestigator, role: 'NHQ_ADMIN' },
          superAdmin,
        ),
      ).rejects.toThrow(
        'The SUPER_ADMIN role cannot be granted or removed through the API',
      );
      expect(usersRepository.editUser).not.toHaveBeenCalled();
    });
  });
});
