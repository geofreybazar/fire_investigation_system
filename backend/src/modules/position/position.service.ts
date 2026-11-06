import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PositionInput } from './schema/position.schema.js';
import { UUID } from 'crypto';
import { PositionRepository } from './position.repository.js';

@Injectable()
export class PositionService {
  constructor(private readonly positionRepository: PositionRepository) {}

  private readonly logger = new Logger(PositionService.name);

  async create(positionData: PositionInput, actorId: string) {
    this.logger.log('Creating new position');
    const position = await this.positionRepository.createPosition(
      positionData,
      actorId,
    );
    return position;
  }

  async findPaginatedPositions(page: number, search?: string) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const { positions, total } =
      await this.positionRepository.findPaginatedPositions(skip, limit, search);

    return {
      data: positions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePositon(id: UUID, positionData: PositionInput, actorId: string) {
    const updatedPosition = await this.positionRepository.updatePosition(
      id,
      positionData,
      actorId,
    );
    if (!updatedPosition) {
      throw new NotFoundException('Position not found');
    }

    return updatedPosition;
  }

  async deletePosiiton(positionid: UUID, actorId: string) {
    const position =
      await this.positionRepository.findPositionForDeletion(positionid);
    if (!position) {
      throw new NotFoundException('Position not found.');
    }

    if (position._count.users > 0) {
      throw new ConflictException(
        'This position cannot be deleted because it has assigned users.',
      );
    }

    await this.positionRepository.deletePosition(positionid, actorId);

    return {
      message: 'Position deleted successfully.',
    };
  }

  async findAllPositions() {
    return await this.positionRepository.findAllPositions();
  }
}
