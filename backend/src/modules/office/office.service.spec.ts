import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { type UUID } from 'crypto';
import { OfficeService } from './office.service.js';
import { OfficeRepository } from './office.repository.js';
import { NotificationDispatcher } from '../notification/notification.dispatcher.js';
import { OfficeAuthorizationService } from './services/office.authorization.service.js';
import { type OfficeInput } from './schema/office.schema.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

const officeId = '11111111-1111-4111-8111-111111111111' as UUID;
const regionalId = '22222222-2222-4222-8222-222222222222';
const nhqId = '33333333-3333-4333-8333-333333333333';

const superAdmin: CurrentUserJwtPayload = {
  sub: '44444444-4444-4444-8444-444444444444' as UUID,
  account_number: 'ADMIN001',
  role: 'SUPER_ADMIN',
  positionId: 'position-1',
  officeId: nhqId,
};

const regionalAdmin: CurrentUserJwtPayload = {
  ...superAdmin,
  role: 'REGIONAL_ADMIN',
  officeId: regionalId,
};

const nhqAdmin: CurrentUserJwtPayload = { ...superAdmin, role: 'NHQ_ADMIN' };

const districtId = '55555555-5555-4555-8555-555555555555';
const otherDistrictId = '66666666-6666-4666-8666-666666666666';

// Offices that the repository "contains", looked up by id.
const offices: Record<
  string,
  { id: string; type: string; regionId: string | null }
> = {
  [nhqId]: { id: nhqId, type: 'NATIONAL_HEADQUARTERS', regionId: null },
  [regionalId]: { id: regionalId, type: 'REGIONAL_OFFICE', regionId: null },
  [districtId]: {
    id: districtId,
    type: 'DISTRICT_FIRE_STATION',
    regionId: regionalId,
  },
  [otherDistrictId]: {
    id: otherDistrictId,
    type: 'DISTRICT_FIRE_STATION',
    regionId: 'other-region',
  },
  [officeId]: { id: officeId, type: 'CITY_FIRE_STATION', regionId: regionalId },
};

const cityStation: OfficeInput = {
  name: 'Quezon City Fire Station',
  type: 'CITY_FIRE_STATION',
  parentId: regionalId,
};

describe('OfficeService', () => {
  let service: OfficeService;
  let dispatcher: { notify: ReturnType<typeof vi.fn> };
  let repository: {
    findById: ReturnType<typeof vi.fn>;
    findByNameUnderParent: ReturnType<typeof vi.fn>;
    findByIdForDeletion: ReturnType<typeof vi.fn>;
    findAllOffices: ReturnType<typeof vi.fn>;
    findPaginatedOffices: ReturnType<typeof vi.fn>;
    createOffice: ReturnType<typeof vi.fn>;
    updateOffice: ReturnType<typeof vi.fn>;
    deleteById: ReturnType<typeof vi.fn>;
    isRegionCodeUsed: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dispatcher = { notify: vi.fn() };
    repository = {
      findById: vi.fn(),
      // By default no other office has the name.
      findByNameUnderParent: vi.fn().mockResolvedValue(null),
      findByIdForDeletion: vi.fn(),
      findAllOffices: vi.fn(),
      findPaginatedOffices: vi.fn(),
      createOffice: vi.fn(),
      updateOffice: vi
        .fn()
        .mockResolvedValue({ office: {}, returnedCases: [] }),
      deleteById: vi.fn(),
      isRegionCodeUsed: vi.fn().mockResolvedValue(false),
    };

    // The real authorization service is used so role/office-type rules are
    // exercised alongside the service logic.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficeService,
        OfficeAuthorizationService,
        { provide: OfficeRepository, useValue: repository },
        { provide: NotificationDispatcher, useValue: dispatcher },
      ],
    }).compile();

    service = module.get<OfficeService>(OfficeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOffice', () => {
    it('creates an office under a valid parent', async () => {
      // A city station must sit under a district/provincial station.
      repository.findById.mockResolvedValue({
        id: regionalId,
        type: 'DISTRICT_FIRE_STATION',
      });
      const created = { id: officeId, ...cityStation };
      repository.createOffice.mockResolvedValue(created);

      await expect(service.createOffice(cityStation, superAdmin)).resolves.toBe(
        created,
      );
      expect(repository.findById).toHaveBeenCalledWith(regionalId);
      expect(repository.createOffice).toHaveBeenCalledWith(
        expect.objectContaining({
          name: cityStation.name,
          type: cityStation.type,
          parentId: cityStation.parentId,
        }),
        superAdmin.sub,
      );
    });

    it('creates a regional office with a region code under NHQ', async () => {
      repository.findById.mockResolvedValue({
        id: nhqId,
        type: 'NATIONAL_HEADQUARTERS',
      });
      repository.createOffice.mockResolvedValue({ id: officeId });

      await service.createOffice(
        {
          name: 'Regional Office NCR',
          type: 'REGIONAL_OFFICE',
          parentId: nhqId,
          regionCode: 'NCR',
        },
        superAdmin,
      );

      expect(repository.createOffice).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'REGIONAL_OFFICE', regionCode: 'NCR' }),
        superAdmin.sub,
      );
    });

    it('rejects a role that cannot manage the office type', async () => {
      await expect(
        service.createOffice(
          { name: 'National Headquarters', type: 'NATIONAL_HEADQUARTERS' },
          regionalAdmin,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.createOffice).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the parent office does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.createOffice(cityStation, superAdmin),
      ).rejects.toThrow(NotFoundException);
      expect(repository.createOffice).not.toHaveBeenCalled();
    });

    it('rejects an invalid parent type for the hierarchy', async () => {
      repository.findById.mockResolvedValue({
        id: nhqId,
        type: 'NATIONAL_HEADQUARTERS',
      });

      await expect(
        service.createOffice({ ...cityStation, parentId: nhqId }, superAdmin),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createOffice).not.toHaveBeenCalled();
    });

    it('rejects a non-NHQ office without a parent', async () => {
      await expect(
        service.createOffice(
          { name: 'Orphan Fire Station', type: 'CITY_FIRE_STATION' },
          superAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createOffice).not.toHaveBeenCalled();
    });

    it('rejects a regional office without a region code', async () => {
      repository.findById.mockResolvedValue({
        id: nhqId,
        type: 'NATIONAL_HEADQUARTERS',
      });

      await expect(
        service.createOffice(
          {
            name: 'Regional Office NCR',
            type: 'REGIONAL_OFFICE',
            parentId: nhqId,
          },
          superAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createOffice).not.toHaveBeenCalled();
    });

    it('rejects a region code on a non-regional office', async () => {
      repository.findById.mockResolvedValue({
        id: regionalId,
        type: 'DISTRICT_FIRE_STATION',
      });

      await expect(
        service.createOffice({ ...cityStation, regionCode: 'NCR' }, superAdmin),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createOffice).not.toHaveBeenCalled();
    });

    it('allows REGIONAL_ADMIN to create a station under a district in their region', async () => {
      repository.findById.mockResolvedValue(offices[districtId]);
      repository.createOffice.mockResolvedValue({ id: officeId });

      await service.createOffice(
        { ...cityStation, parentId: districtId },
        regionalAdmin,
      );

      expect(repository.createOffice).toHaveBeenCalled();
    });

    it('rejects a name already used under the same parent', async () => {
      repository.findById.mockResolvedValue(offices[districtId]);
      repository.findByNameUnderParent.mockResolvedValue({ id: officeId });

      await expect(
        service.createOffice(
          { ...cityStation, parentId: districtId },
          superAdmin,
        ),
      ).rejects.toThrow(ConflictException);
      expect(repository.findByNameUnderParent).toHaveBeenCalledWith(
        cityStation.name,
        districtId,
        undefined,
      );
      expect(repository.createOffice).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from creating an office under a parent in another region', async () => {
      repository.findById.mockResolvedValue(offices[otherDistrictId]);

      await expect(
        service.createOffice(
          { ...cityStation, parentId: otherDistrictId },
          regionalAdmin,
        ),
      ).rejects.toThrow('You can only manage offices within your own region');
      expect(repository.createOffice).not.toHaveBeenCalled();
    });
  });

  describe('findPaginatedOffices', () => {
    it('computes skip from page and returns pagination metadata', async () => {
      const offices = [{ id: officeId }];
      repository.findPaginatedOffices.mockResolvedValue({ offices, total: 31 });

      const result = await service.findPaginatedOffices(
        regionalAdmin,
        2,
        'quezon',
        'CITY_FIRE_STATION',
      );

      expect(repository.findPaginatedOffices).toHaveBeenCalledWith(
        regionalAdmin,
        10,
        10,
        'quezon',
        'CITY_FIRE_STATION',
      );
      expect(result).toEqual({
        data: offices,
        pagination: { page: 2, limit: 10, total: 31, totalPages: 4 },
      });
    });
  });

  describe('getAllOffices', () => {
    it('returns the offices visible to the user', async () => {
      const offices = [{ id: officeId }];
      repository.findAllOffices.mockResolvedValue(offices);

      await expect(service.getAllOffices(regionalAdmin)).resolves.toBe(offices);
      expect(repository.findAllOffices).toHaveBeenCalledWith(regionalAdmin);
    });
  });

  describe('updateOffice', () => {
    beforeEach(() => {
      repository.findById.mockImplementation((id: string) =>
        Promise.resolve(offices[id] ?? null),
      );
    });

    const station = { ...cityStation, parentId: districtId };

    it("tells the station's chief investigators about returned cases (Q-51)", async () => {
      repository.updateOffice.mockResolvedValue({
        office: { id: officeId, ...station },
        returnedCases: [{ caseId: 'c-1', caseNo: 'NO-1', stationId: officeId }],
      });

      await service.updateOffice(officeId, station, regionalAdmin);

      expect(dispatcher.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: regionalAdmin.sub,
          recipients: expect.objectContaining({ officeId }),
        }),
      );
    });

    it('updates an office that passes all checks', async () => {
      const updated = { id: officeId, ...station };
      repository.updateOffice.mockResolvedValue({
        office: updated,
        returnedCases: [],
      });

      await expect(
        service.updateOffice(officeId, station, regionalAdmin),
      ).resolves.toBe(updated);
      expect(repository.updateOffice).toHaveBeenCalledWith(
        officeId,
        station,
        regionalAdmin.sub,
      );
    });

    it('throws NotFoundException when the office does not exist', async () => {
      await expect(
        service.updateOffice(
          '77777777-7777-4777-8777-777777777777' as UUID,
          station,
          superAdmin,
        ),
      ).rejects.toThrow('Office not found.');
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('rejects a role that cannot manage the new office type', async () => {
      await expect(
        service.updateOffice(
          officeId,
          { name: 'Regional Office NCR', type: 'REGIONAL_OFFICE' },
          regionalAdmin,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('rejects a role that cannot manage the office as it is now', async () => {
      // A REGIONAL_ADMIN may not turn their own regional office into a station.
      await expect(
        service.updateOffice(regionalId as UUID, station, regionalAdmin),
      ).rejects.toThrow(
        'REGIONAL_ADMIN is not allowed to manage a REGIONAL_OFFICE',
      );
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from updating an office in another region', async () => {
      await expect(
        service.updateOffice(
          otherDistrictId as UUID,
          {
            name: 'Other District',
            type: 'DISTRICT_FIRE_STATION',
            parentId: regionalId,
          },
          regionalAdmin,
        ),
      ).rejects.toThrow('You can only manage offices within your own region');
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from moving an office under a parent in another region', async () => {
      await expect(
        service.updateOffice(
          officeId,
          { ...station, parentId: otherDistrictId },
          regionalAdmin,
        ),
      ).rejects.toThrow('You can only manage offices within your own region');
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the parent office does not exist', async () => {
      await expect(
        service.updateOffice(
          officeId,
          { ...station, parentId: '88888888-8888-4888-8888-888888888888' },
          superAdmin,
        ),
      ).rejects.toThrow('Parent office not found');
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('ignores the office itself when checking the name', async () => {
      repository.updateOffice.mockResolvedValue({
        office: { id: officeId },
        returnedCases: [],
      });

      await service.updateOffice(officeId, station, regionalAdmin);

      expect(repository.findByNameUnderParent).toHaveBeenCalledWith(
        station.name,
        districtId,
        officeId,
      );
    });

    it('rejects renaming to a name another office under the parent uses', async () => {
      repository.findByNameUnderParent.mockResolvedValue({
        id: 'other-office',
      });

      await expect(
        service.updateOffice(officeId, station, regionalAdmin),
      ).rejects.toThrow(
        `An office named "${station.name}" already exists under the same parent office.`,
      );
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('rejects an invalid parent type for the hierarchy', async () => {
      await expect(
        service.updateOffice(
          officeId,
          { ...station, parentId: nhqId },
          superAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });
  });

  describe('deleteOffice', () => {
    const forDeletion = (
      id: string,
      users = 0,
      children = 0,
      records: Partial<Record<string, number>> = {},
    ) => ({
      ...offices[id],
      _count: {
        users,
        children,
        stationCases: 0,
        createdCases: 0,
        handledCases: 0,
        conductedInvestigations: 0,
        referralsFrom: 0,
        referralsTo: 0,
        ...records,
      },
    });

    it('deletes an office with no users or child offices', async () => {
      repository.findByIdForDeletion.mockResolvedValue(forDeletion(officeId));

      await expect(service.deleteOffice(officeId, superAdmin)).resolves.toEqual(
        {
          message: 'Office deleted successfully.',
        },
      );
      expect(repository.deleteById).toHaveBeenCalledWith(
        officeId,
        superAdmin.sub,
      );
    });

    it('allows REGIONAL_ADMIN to delete an office in their region', async () => {
      repository.findByIdForDeletion.mockResolvedValue(forDeletion(officeId));

      await service.deleteOffice(officeId, regionalAdmin);

      expect(repository.deleteById).toHaveBeenCalledWith(
        officeId,
        regionalAdmin.sub,
      );
    });

    it('throws NotFoundException when the office does not exist', async () => {
      repository.findByIdForDeletion.mockResolvedValue(null);

      await expect(service.deleteOffice(officeId, superAdmin)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('forbids NHQ_ADMIN from deleting the National Headquarters', async () => {
      repository.findByIdForDeletion.mockResolvedValue(forDeletion(nhqId));

      await expect(
        service.deleteOffice(nhqId as UUID, nhqAdmin),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from deleting their regional office', async () => {
      repository.findByIdForDeletion.mockResolvedValue(forDeletion(regionalId));

      await expect(
        service.deleteOffice(regionalId as UUID, regionalAdmin),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('forbids REGIONAL_ADMIN from deleting an office in another region', async () => {
      repository.findByIdForDeletion.mockResolvedValue(
        forDeletion(otherDistrictId),
      );

      await expect(
        service.deleteOffice(otherDistrictId as UUID, regionalAdmin),
      ).rejects.toThrow('You can only manage offices within your own region');
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('throws ConflictException when users are assigned', async () => {
      repository.findByIdForDeletion.mockResolvedValue(
        forDeletion(officeId, 1),
      );

      await expect(service.deleteOffice(officeId, superAdmin)).rejects.toThrow(
        'This office cannot be deleted because it has assigned users.',
      );
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('throws ConflictException when child offices exist', async () => {
      repository.findByIdForDeletion.mockResolvedValue(
        forDeletion(officeId, 0, 3),
      );

      await expect(service.deleteOffice(officeId, superAdmin)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it.each([
      'stationCases',
      'createdCases',
      'handledCases',
      'conductedInvestigations',
      'referralsFrom',
      'referralsTo',
    ])('throws ConflictException when the office has %s', async (record) => {
      repository.findByIdForDeletion.mockResolvedValue(
        forDeletion(officeId, 0, 0, { [record]: 1 }),
      );

      await expect(service.deleteOffice(officeId, superAdmin)).rejects.toThrow(
        'This office cannot be deleted because it has investigation case records.',
      );
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('updateOffice region code', () => {
    const regional = {
      id: regionalId,
      type: 'REGIONAL_OFFICE',
      regionId: null,
      regionCode: 'NCR',
    };
    const regionalInput: OfficeInput = {
      name: 'Regional Office NCR',
      type: 'REGIONAL_OFFICE',
      parentId: nhqId,
      regionCode: 'NCR2',
    };

    beforeEach(() => {
      repository.findById.mockImplementation((id: string) =>
        Promise.resolve(id === regionalId ? regional : (offices[id] ?? null)),
      );
    });

    it('blocks changing a region code that case numbers use', async () => {
      repository.isRegionCodeUsed.mockResolvedValue(true);

      await expect(
        service.updateOffice(regionalId as UUID, regionalInput, superAdmin),
      ).rejects.toThrow(
        'The region code cannot be changed because case numbers already use it.',
      );
      expect(repository.isRegionCodeUsed).toHaveBeenCalledWith('NCR');
      expect(repository.updateOffice).not.toHaveBeenCalled();
    });

    it('allows changing an unused region code', async () => {
      await service.updateOffice(regionalId as UUID, regionalInput, superAdmin);

      expect(repository.updateOffice).toHaveBeenCalled();
    });

    it('does not check usage when the code is unchanged apart from case', async () => {
      await service.updateOffice(
        regionalId as UUID,
        { ...regionalInput, regionCode: ' ncr ' },
        superAdmin,
      );

      expect(repository.isRegionCodeUsed).not.toHaveBeenCalled();
      expect(repository.updateOffice).toHaveBeenCalled();
    });
  });
});
