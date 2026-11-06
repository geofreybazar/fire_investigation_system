import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { OfficeRepository } from '../office/office.repository.js';
import { OfficeAuthorizationService } from '../office/services/office.authorization.service.js';
import { UsersAuthorizationService } from './service/users.authorization.service.js';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    OfficeRepository,
    OfficeAuthorizationService,
    UsersAuthorizationService,
  ],
})
export class UsersModule {}
