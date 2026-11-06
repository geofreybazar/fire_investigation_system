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
  Req,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

import { OfficeService } from './office.service.js';
import { officeSchema, type OfficeInput } from './schema/office.schema.js';
import { OfficeType } from '../../generated/prisma/enums.js';

import { type UUID } from 'crypto';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

@Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'REGIONAL_ADMIN')
@UseGuards(AuthGuard, RoleGuard)
@Controller('office_api')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}

  @Post()
  async createOffice(
    @Body({ schema: officeSchema }) officeData: OfficeInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.officeService.createOffice(officeData, user);
  }

  @Get()
  async findPaginatedOffices(
    @CurrentUser() user: CurrentUserJwtPayload,
    @Query('page') page: number,
    @Query('search') search?: string,
    @Query('officetype') officetype?: string,
  ) {
    const searchQuery = search || '';
    const officeType = officetype || '';

    return await this.officeService.findPaginatedOffices(
      user,
      Number(page),
      searchQuery,
      officeType as OfficeType,
    );
  }

  @Get('/alloffices')
  async getAllOffices(@CurrentUser() user: CurrentUserJwtPayload) {
    return await this.officeService.getAllOffices(user);
  }

  @Patch(':id')
  async updateOffice(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @Body({ schema: officeSchema }) officeData: OfficeInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.officeService.updateOffice(id, officeData, user);
  }

  @Delete(':id')
  async deleteOffice(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return await this.officeService.deleteOffice(id, user);
  }
}
