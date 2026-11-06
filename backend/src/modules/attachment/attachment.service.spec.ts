import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { type UUID } from 'crypto';
import { AttachmentService } from './attachment.service.js';
import { AttachmentRepository } from './attachment.repository.js';
import { AttachmentStorage } from './attachment.storage.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

const STATION = 'station-1';
const OTHER_STATION = 'station-2';
const caseId = 'case-1';
const investigationId = 'investigation-1';

const userWith = (
  role: CurrentUserJwtPayload['role'],
  officeId = STATION,
  sub = '11111111-1111-4111-8111-111111111111',
): CurrentUserJwtPayload => ({
  sub: sub as UUID,
  account_number: 'ACC001',
  role,
  positionId: 'position-1',
  officeId,
});

// The station's chief, who handles (and created) the case.
const chief = userWith('CITY_MUNICIPALITY_CHIEF_INVESTIGATOR');
const investigator = userWith(
  'CITY_MUNICIPALITY_INVESTIGATOR',
  STATION,
  '22222222-2222-4222-8222-222222222222',
);

const investigationCase = (overrides: Record<string, unknown> = {}) => ({
  id: caseId,
  caseNo: 'INV-2026-03-NCR-000001',
  createdById: 'creator-1',
  handlingOfficeId: STATION,
  deletedAt: null,
  station: { id: STATION, parentId: 'district-1', regionId: 'region-1' },
  ...overrides,
});

const pdf = {
  originalname: 'scene report.pdf',
  size: 9,
  buffer: Buffer.from('%PDF-1.7\n'),
};

describe('AttachmentService', () => {
  let service: AttachmentService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let storage: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    repository = {
      findOfficeType: vi.fn((officeId: string) =>
        Promise.resolve({ id: officeId, type: 'CITY_FIRE_STATION' }),
      ),
      findCase: vi.fn().mockResolvedValue(investigationCase()),
      findInvestigation: vi.fn().mockResolvedValue({
        id: investigationId,
        investigationNo: 'INV-1',
        caseId,
        assignedInvestigatorId: investigator.sub,
        completedAt: null,
        case: investigationCase(),
      }),
      create: vi.fn((data) => Promise.resolve({ id: 'att-1', ...data })),
      findById: vi.fn(),
      listForCase: vi.fn().mockResolvedValue([]),
      listForInvestigation: vi.fn().mockResolvedValue([]),
      findPaginated: vi.fn().mockResolvedValue({ attachments: [], total: 0 }),
      softRemove: vi.fn().mockResolvedValue(true),
      recordDownload: vi.fn(),
    };
    storage = {
      save: vi.fn().mockResolvedValue('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
      open: vi.fn().mockReturnValue('stream'),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentService,
        { provide: AttachmentRepository, useValue: repository },
        { provide: AttachmentStorage, useValue: storage },
      ],
    }).compile();

    service = module.get<AttachmentService>(AttachmentService);
  });

  describe('uploading to a case', () => {
    it("lets the case's creator attach after the case moved to another office", async () => {
      const creator = userWith(
        'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR',
        STATION,
        'creator-1',
      );
      repository.findCase.mockResolvedValue(
        investigationCase({ handlingOfficeId: 'region-1' }),
      );

      await expect(
        service.uploadToCase(caseId, pdf, {}, creator),
      ).resolves.toBeDefined();
      await expect(
        service.uploadToCase(caseId, pdf, {}, chief),
      ).rejects.toThrow(ForbiddenException);
    });

    it('stores the file with the detected type, size and hash', async () => {
      await service.uploadToCase(caseId, pdf, {}, chief);

      expect(storage.save).toHaveBeenCalledWith(pdf.buffer);
      expect(repository.create).toHaveBeenCalledWith({
        caseId,
        uploadedById: chief.sub,
        originalName: 'scene report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 9,
        storageKey: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        description: null,
      });
    });

    it("forbids chiefs of another station, who can't see it", async () => {
      await expect(
        service.uploadToCase(
          caseId,
          pdf,
          {},
          userWith('CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', OTHER_STATION),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids viewers and investigators', async () => {
      await expect(
        service.uploadToCase(caseId, pdf, {}, investigator),
      ).rejects.toThrow(ForbiddenException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('rejects a missing or empty file', async () => {
      await expect(
        service.uploadToCase(caseId, undefined, {}, chief),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadToCase(
          caseId,
          { ...pdf, size: 0, buffer: Buffer.alloc(0) },
          {},
          chief,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a file whose content is not an allowed type, whatever its name', async () => {
      await expect(
        service.uploadToCase(
          caseId,
          { originalname: 'photo.jpg', size: 6, buffer: Buffer.from('<html>') },
          {},
          chief,
        ),
      ).rejects.toThrow(UnsupportedMediaTypeException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('deletes the stored file if the database write fails', async () => {
      repository.create.mockRejectedValue(new Error('db down'));

      await expect(
        service.uploadToCase(caseId, pdf, {}, chief),
      ).rejects.toThrow('db down');
      expect(storage.delete).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      );
    });

    it('hides a deleted case', async () => {
      repository.findCase.mockResolvedValue(
        investigationCase({ deletedAt: new Date() }),
      );

      await expect(
        service.uploadToCase(caseId, pdf, {}, chief),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploading evidence to an investigation', () => {
    it('lets the assigned investigator add evidence', async () => {
      await service.uploadToInvestigation(
        investigationId,
        pdf,
        {},
        investigator,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          caseId,
          investigationId,
          uploadedById: investigator.sub,
        }),
      );
    });

    it('forbids anyone else', async () => {
      await expect(
        service.uploadToInvestigation(
          investigationId,
          pdf,
          {},
          userWith('CITY_MUNICIPALITY_CHIEF_INVESTIGATOR'),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses evidence once the investigation is approved', async () => {
      repository.findInvestigation.mockResolvedValue({
        id: investigationId,
        investigationNo: 'INV-1',
        caseId,
        assignedInvestigatorId: investigator.sub,
        completedAt: new Date(),
        case: investigationCase(),
      });

      await expect(
        service.uploadToInvestigation(investigationId, pdf, {}, investigator),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('downloading and removing', () => {
    const stored = (overrides: Record<string, unknown> = {}) => ({
      id: 'att-1',
      caseId,
      investigationId: null,
      originalName: 'scene report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 9,
      storageKey: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      removedAt: null,
      uploadedBy: { id: chief.sub },
      case: investigationCase(),
      investigation: null,
      ...overrides,
    });

    it('audits every download', async () => {
      repository.findById.mockResolvedValue(stored());

      const result = await service.download('att-1', investigator);

      expect(repository.recordDownload).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'att-1' }),
        { officeId: STATION, regionId: 'region-1' },
        investigator.sub,
      );
      expect(result.stream).toBe('stream');
    });

    it('treats removed and out-of-scope files as missing', async () => {
      repository.findById.mockResolvedValue(stored({ removedAt: new Date() }));
      await expect(service.download('att-1', chief)).rejects.toThrow(
        NotFoundException,
      );

      repository.findById.mockResolvedValue(stored());
      await expect(
        service.download(
          'att-1',
          userWith('CITY_MUNICIPALITY_INVESTIGATOR', OTHER_STATION),
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.recordDownload).not.toHaveBeenCalled();
    });

    it('lets only the uploader remove a file', async () => {
      repository.findById.mockResolvedValue(stored());

      await expect(service.remove('att-1', investigator)).rejects.toThrow(
        ForbiddenException,
      );
      await service.remove('att-1', chief);
      expect(repository.softRemove).toHaveBeenCalledWith('att-1', chief.sub);
    });

    it('keeps evidence of an approved investigation', async () => {
      repository.findById.mockResolvedValue(
        stored({
          investigationId,
          uploadedBy: { id: investigator.sub },
          investigation: { completedAt: new Date() },
        }),
      );

      await expect(service.remove('att-1', investigator)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  it('lists only attachments on cases in scope', async () => {
    await service.findPaginated({ page: 1, kind: 'investigation' }, chief);

    expect(repository.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        removedAt: null,
        investigationId: { not: null },
        case: expect.objectContaining({ deletedAt: null }),
      }),
      0,
      20,
    );
  });
});
