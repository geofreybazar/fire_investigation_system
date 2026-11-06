import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { ROLE } from '../../generated/prisma/enums.js';
import { AuditService } from './audit.service.js';
import {
  listAuditLogsQuerySchema,
  type ListAuditLogsQuery,
} from './schema/audit.schema.js';

@Roles(ROLE.SUPER_ADMIN, ROLE.NHQ_ADMIN, ROLE.REGIONAL_ADMIN)
@UseGuards(AuthGuard, RoleGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findPaginated(
    @Query({ schema: listAuditLogsQuerySchema }) query: ListAuditLogsQuery,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.auditService.findPaginated(query, user);
  }
}
