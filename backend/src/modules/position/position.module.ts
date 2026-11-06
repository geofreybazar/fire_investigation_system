import { Module } from '@nestjs/common';
import { PositionService } from './position.service.js';
import { PositionController } from './position.controller.js';
import { PositionRepository } from './position.repository.js';

@Module({
  controllers: [PositionController],
  providers: [PositionService, PositionRepository],
})
export class PositionModule {}
