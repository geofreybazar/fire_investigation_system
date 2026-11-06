import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PositionService } from './position.service.js';
import {
  positionSchema,
  type PositionInput,
} from './schema/position.schema.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { type UUID } from 'crypto';

@Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'REGIONAL_ADMIN')
@UseGuards(AuthGuard, RoleGuard)
@Controller('position_api')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  async create(
    @Body({ schema: positionSchema }) positionData: PositionInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.positionService.create(positionData, user.sub);
  }

  @Get()
  async findPaginatedPositions(
    @Query('page') page: number,
    @Query('search') search?: string,
  ) {
    return await this.positionService.findPaginatedPositions(page, search);
  }

  @Get('/allpositions')
  async findAllPositions() {
    return await this.positionService.findAllPositions();
  }

  @Patch(':id')
  async updatePositon(
    @Body({ schema: positionSchema }) positionData: PositionInput,
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.positionService.updatePositon(id, positionData, user.sub);
  }

  @Delete(':id')
  async deletePosiiton(
    @Param('id', new ParseUUIDPipe()) positionid: UUID,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.positionService.deletePosiiton(positionid, user.sub);
  }
}
