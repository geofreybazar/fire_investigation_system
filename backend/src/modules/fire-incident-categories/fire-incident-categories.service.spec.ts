import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FireIncidentCategoriesService } from './fire-incident-categories.service.js';
import { FireIncidentCategoriesRepository } from './fire-incident-categories.repository.js';
import { type FireIncidentCategoriesInput } from './schema/fire-incident-categories.schema.js';

const categoryId = '11111111-1111-4111-8111-111111111111';
const input = { name: 'Structural' } as FireIncidentCategoriesInput;

const actorId = 'actor-1';

describe('FireIncidentCategoriesService', () => {
  let service: FireIncidentCategoriesService;
  let repository: {
    addFireIncidentCategory: ReturnType<typeof vi.fn>;
    getPaginatedCategories: ReturnType<typeof vi.fn>;
    editFireIncidentCategory: ReturnType<typeof vi.fn>;
    getCategoryById: ReturnType<typeof vi.fn>;
    deleteById: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      addFireIncidentCategory: vi.fn(),
      getPaginatedCategories: vi.fn(),
      editFireIncidentCategory: vi.fn(),
      getCategoryById: vi.fn(),
      deleteById: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FireIncidentCategoriesService,
        { provide: FireIncidentCategoriesRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<FireIncidentCategoriesService>(
      FireIncidentCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFireIncidentCategory', () => {
    it('creates and returns the category', async () => {
      const created = { id: categoryId, ...input };
      repository.addFireIncidentCategory.mockResolvedValue(created);

      await expect(
        service.addFireIncidentCategory(input, actorId),
      ).resolves.toBe(created);
      expect(repository.addFireIncidentCategory).toHaveBeenCalledWith(
        input,
        actorId,
      );
    });
  });

  describe('getPaginatedCategories', () => {
    it('computes skip from page and returns pagination metadata', async () => {
      const categories = [{ id: categoryId, ...input }];
      repository.getPaginatedCategories.mockResolvedValue({
        fireIncidentCategories: categories,
        totalCount: 11,
      });

      const result = await service.getPaginatedCategories(2, 'struct');

      expect(repository.getPaginatedCategories).toHaveBeenCalledWith(
        'struct',
        10,
        10,
      );
      expect(result).toEqual({
        data: categories,
        pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
      });
    });
  });

  describe('editFireIncidentCategory', () => {
    it('returns the edited category', async () => {
      const edited = { id: categoryId, ...input };
      repository.editFireIncidentCategory.mockResolvedValue(edited);

      await expect(
        service.editFireIncidentCategory(categoryId, input, actorId),
      ).resolves.toBe(edited);
      expect(repository.editFireIncidentCategory).toHaveBeenCalledWith(
        categoryId,
        input,
        actorId,
      );
    });
  });

  describe('getCategoryById', () => {
    it('returns the category from the repository', async () => {
      const category = { id: categoryId, ...input, subCategories: [] };
      repository.getCategoryById.mockResolvedValue(category);

      await expect(service.getCategoryById(categoryId)).resolves.toBe(category);
      expect(repository.getCategoryById).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('deleteCategory', () => {
    it('deletes a category with no sub categories', async () => {
      repository.getCategoryById.mockResolvedValue({
        id: categoryId,
        subCategories: [],
        _count: { cases: 0 },
      });

      await expect(
        service.deleteCategory(categoryId, actorId),
      ).resolves.toEqual({
        message: 'Category deleted successfully.',
      });
      expect(repository.deleteById).toHaveBeenCalledWith(categoryId, actorId);
    });

    it('throws NotFoundException when the category does not exist', async () => {
      repository.getCategoryById.mockResolvedValue(null);

      await expect(service.deleteCategory(categoryId, actorId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('throws ConflictException when sub categories exist', async () => {
      repository.getCategoryById.mockResolvedValue({
        id: categoryId,
        subCategories: [{ id: 'sub-1' }],
        _count: { cases: 0 },
      });

      await expect(service.deleteCategory(categoryId, actorId)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('throws ConflictException when cases use the category', async () => {
      repository.getCategoryById.mockResolvedValue({
        id: categoryId,
        subCategories: [],
        _count: { cases: 2 },
      });

      await expect(service.deleteCategory(categoryId, actorId)).rejects.toThrow(
        'This category cannot be deleted because investigation cases use it.',
      );
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });
});
