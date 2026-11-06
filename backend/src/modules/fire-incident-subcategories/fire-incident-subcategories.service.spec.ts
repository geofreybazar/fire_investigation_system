import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FireIncidentSubcategoriesService } from './fire-incident-subcategories.service.js';
import { FireIncidentSubCategoriesRepository } from './fire-incident-subcategories.repository.js';
import { type FireIncidentSubCategoriesInput } from './schema/fire-incident-subcategories.schema.js';

const actorId = 'actor-1';

describe('FireIncidentSubcategoriesService', () => {
  let service: FireIncidentSubcategoriesService;
  let repository: {
    addFireIncidentSubcategory: ReturnType<typeof vi.fn>;
    getSubcategoryById: ReturnType<typeof vi.fn>;
    editFireIncidentSubcategory: ReturnType<typeof vi.fn>;
    deleteById: ReturnType<typeof vi.fn>;
  };

  const subcategoryId = 'sub-1';

  beforeEach(async () => {
    repository = {
      addFireIncidentSubcategory: vi.fn(),
      getSubcategoryById: vi.fn(),
      editFireIncidentSubcategory: vi.fn(),
      deleteById: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FireIncidentSubcategoriesService,
        { provide: FireIncidentSubCategoriesRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<FireIncidentSubcategoriesService>(
      FireIncidentSubcategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFireIncidentSubcategory', () => {
    it('creates and returns the sub category', async () => {
      const input = { name: 'Residential' } as FireIncidentSubCategoriesInput;
      const created = { id: 'sub-1', ...input };
      repository.addFireIncidentSubcategory.mockResolvedValue(created);

      await expect(
        service.addFireIncidentSubcategory(input, actorId),
      ).resolves.toBe(created);
      expect(repository.addFireIncidentSubcategory).toHaveBeenCalledWith(
        input,
        actorId,
      );
    });
  });

  describe('getSubcategoryById', () => {
    it('throws NotFoundException when the sub category does not exist', async () => {
      repository.getSubcategoryById.mockResolvedValue(null);

      await expect(service.getSubcategoryById(subcategoryId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('editFireIncidentSubcategory', () => {
    it('renames an existing sub category', async () => {
      repository.getSubcategoryById.mockResolvedValue({
        id: subcategoryId,
        _count: { cases: 3 },
      });
      repository.editFireIncidentSubcategory.mockResolvedValue({
        id: subcategoryId,
        name: 'Commercial',
      });

      await expect(
        service.editFireIncidentSubcategory(
          subcategoryId,
          { name: 'Commercial' },
          actorId,
        ),
      ).resolves.toEqual({ id: subcategoryId, name: 'Commercial' });
      expect(repository.editFireIncidentSubcategory).toHaveBeenCalledWith(
        subcategoryId,
        { name: 'Commercial' },
        actorId,
      );
    });

    it('throws NotFoundException for a missing sub category', async () => {
      repository.getSubcategoryById.mockResolvedValue(null);

      await expect(
        service.editFireIncidentSubcategory(
          subcategoryId,
          { name: 'X' },
          actorId,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.editFireIncidentSubcategory).not.toHaveBeenCalled();
    });
  });

  describe('deleteSubcategory', () => {
    it('deletes a sub category no case uses', async () => {
      repository.getSubcategoryById.mockResolvedValue({
        id: subcategoryId,
        _count: { cases: 0 },
      });

      await expect(
        service.deleteSubcategory(subcategoryId, actorId),
      ).resolves.toEqual({
        message: 'Sub category deleted successfully.',
      });
      expect(repository.deleteById).toHaveBeenCalledWith(
        subcategoryId,
        actorId,
      );
    });

    it('throws ConflictException when cases use the sub category', async () => {
      repository.getSubcategoryById.mockResolvedValue({
        id: subcategoryId,
        _count: { cases: 1 },
      });

      await expect(
        service.deleteSubcategory(subcategoryId, actorId),
      ).rejects.toThrow(ConflictException);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing sub category', async () => {
      repository.getSubcategoryById.mockResolvedValue(null);

      await expect(
        service.deleteSubcategory(subcategoryId, actorId),
      ).rejects.toThrow(NotFoundException);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });
});
