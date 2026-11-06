import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { type UUID } from 'crypto';
import { PositionService } from './position.service.js';
import { PositionRepository } from './position.repository.js';

const positionId = '11111111-1111-4111-8111-111111111111' as UUID;

const actorId = 'actor-1';

describe('PositionService', () => {
  let service: PositionService;
  let repository: {
    createPosition: ReturnType<typeof vi.fn>;
    findPaginatedPositions: ReturnType<typeof vi.fn>;
    updatePosition: ReturnType<typeof vi.fn>;
    findPositionForDeletion: ReturnType<typeof vi.fn>;
    deletePosition: ReturnType<typeof vi.fn>;
    findAllPositions: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      createPosition: vi.fn(),
      findPaginatedPositions: vi.fn(),
      updatePosition: vi.fn(),
      findPositionForDeletion: vi.fn(),
      deletePosition: vi.fn(),
      findAllPositions: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionService,
        { provide: PositionRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<PositionService>(PositionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates and returns the position', async () => {
      const created = { id: positionId, name: 'Fire Marshal' };
      repository.createPosition.mockResolvedValue(created);

      await expect(
        service.create({ name: 'Fire Marshal' }, actorId),
      ).resolves.toBe(created);
      expect(repository.createPosition).toHaveBeenCalledWith(
        { name: 'Fire Marshal' },
        actorId,
      );
    });
  });

  describe('findPaginatedPositions', () => {
    it('computes skip from page and returns pagination metadata', async () => {
      const positions = [{ id: positionId, name: 'Fire Marshal' }];
      repository.findPaginatedPositions.mockResolvedValue({
        positions,
        total: 25,
      });

      const result = await service.findPaginatedPositions(3, 'fire');

      expect(repository.findPaginatedPositions).toHaveBeenCalledWith(
        20,
        10,
        'fire',
      );
      expect(result).toEqual({
        data: positions,
        pagination: { page: 3, limit: 10, total: 25, totalPages: 3 },
      });
    });

    it('returns zero pages when there are no positions', async () => {
      repository.findPaginatedPositions.mockResolvedValue({
        positions: [],
        total: 0,
      });

      const result = await service.findPaginatedPositions(1);

      expect(repository.findPaginatedPositions).toHaveBeenCalledWith(
        0,
        10,
        undefined,
      );
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('updatePositon', () => {
    it('returns the updated position', async () => {
      const updated = { id: positionId, name: 'Senior Inspector' };
      repository.updatePosition.mockResolvedValue(updated);

      await expect(
        service.updatePositon(
          positionId,
          { name: 'Senior Inspector' },
          actorId,
        ),
      ).resolves.toBe(updated);
      expect(repository.updatePosition).toHaveBeenCalledWith(
        positionId,
        { name: 'Senior Inspector' },
        actorId,
      );
    });

    it('throws NotFoundException when the position does not exist', async () => {
      repository.updatePosition.mockResolvedValue(null);

      await expect(
        service.updatePositon(
          positionId,
          { name: 'Senior Inspector' },
          actorId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePosiiton', () => {
    it('deletes a position with no assigned users', async () => {
      repository.findPositionForDeletion.mockResolvedValue({
        id: positionId,
        _count: { users: 0 },
      });

      await expect(
        service.deletePosiiton(positionId, actorId),
      ).resolves.toEqual({
        message: 'Position deleted successfully.',
      });
      expect(repository.deletePosition).toHaveBeenCalledWith(
        positionId,
        actorId,
      );
    });

    it('throws NotFoundException when the position does not exist', async () => {
      repository.findPositionForDeletion.mockResolvedValue(null);

      await expect(service.deletePosiiton(positionId, actorId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deletePosition).not.toHaveBeenCalled();
    });

    it('throws ConflictException when users are assigned', async () => {
      repository.findPositionForDeletion.mockResolvedValue({
        id: positionId,
        _count: { users: 2 },
      });

      await expect(service.deletePosiiton(positionId, actorId)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.deletePosition).not.toHaveBeenCalled();
    });
  });

  describe('findAllPositions', () => {
    it('returns every position from the repository', async () => {
      const positions = [{ id: positionId, name: 'Fire Marshal' }];
      repository.findAllPositions.mockResolvedValue(positions);

      await expect(service.findAllPositions()).resolves.toBe(positions);
    });
  });
});
