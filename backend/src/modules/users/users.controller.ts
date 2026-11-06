import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { UsersService } from './users.service.js';

import {
  changePasswordSchema,
  changeUserStatusSchema,
  userSchema,
  type ChangePasswordInput,
  type UserInput,
  type ChangeUserStatusInput,
} from './schema/user.schema.js';
import { RANK } from '../../generated/prisma/enums.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type UUID } from 'crypto';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { AllowPendingPasswordChange } from '../../common/decorators/allow-pending-password-change.decorator.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'REGIONAL_ADMIN')
  @UseGuards(AuthGuard, RoleGuard)
  @Post()
  async createUser(
    @Body({ schema: userSchema }) userData: UserInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.usersService.createUser(userData, user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUser(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.usersService.getUser(id, user);
  }

  @AllowPendingPasswordChange()
  @UseGuards(AuthGuard, RoleGuard)
  @Patch()
  async changePassword(
    @Body({ schema: changePasswordSchema }) passwordData: ChangePasswordInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.usersService.changePassword(passwordData, user.sub);
  }

  @Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'REGIONAL_ADMIN')
  @UseGuards(AuthGuard, RoleGuard)
  @Get()
  async findPaginatedUsers(
    @CurrentUser() user: CurrentUserJwtPayload,
    @Query('page') page: number,
    @Query('search') search?: string,
    @Query('officeid') officeid?: string,
    @Query('rank') rank?: RANK,
    @Query('status') status?: 'Active' | 'Inactive',
  ) {
    const searchQuery = search || '';
    const officeId = officeid || '';

    const userStatus = status || 'Active';

    return this.usersService.findPaginatedUsers(
      user,
      page,
      searchQuery,
      officeId as UUID,
      userStatus,
      rank,
    );
  }

  @Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'REGIONAL_ADMIN')
  @UseGuards(AuthGuard, RoleGuard)
  @Patch(':id')
  async changeUserStatus(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @Body({ schema: changeUserStatusSchema }) data: ChangeUserStatusInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.usersService.changeUserStatus(id, data, user);
  }

  @Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'REGIONAL_ADMIN')
  @UseGuards(AuthGuard, RoleGuard)
  @Patch('/edituser/:id')
  async editUser(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @Body({ schema: userSchema }) userData: UserInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.usersService.editUser(id, userData, user);
  }
}
