import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvestigationService } from './investigation.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { ROLE } from '../../generated/prisma/enums.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import {
  investigationPageSchema,
  reviewReportSchema,
  updateInvestigationSchema,
  type InvestigationPageQuery,
  type ReviewReportInput,
  type UpdateInvestigationInput,
} from './schema/investigation.schema.js';
import {
  CHIEF_INVESTIGATOR_ROLES,
  INVESTIGATOR_ROLES,
} from './utils/investigation-rules.js';
import { CASE_VIEWER_ROLES } from './utils/case-scope.js';

const CHIEFS = [...CHIEF_INVESTIGATOR_ROLES, ROLE.SUPER_ADMIN];
const INVESTIGATORS = [...INVESTIGATOR_ROLES, ROLE.SUPER_ADMIN];

// Every route sets its own roles; the class-level list (case viewers) is
// the default so a new route is never left open.
@Roles(...CASE_VIEWER_ROLES)
@UseGuards(AuthGuard, RoleGuard)
@Controller('investigation')
export class InvestigationController {
  constructor(private readonly investigationService: InvestigationService) {}

  @Roles(...CHIEFS)
  @Get('queue')
  async findQueue(
    @Query({ schema: investigationPageSchema }) query: InvestigationPageQuery,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.investigationService.findQueue(query.page, user);
  }

  @Roles(...INVESTIGATORS)
  @Get('assigned')
  async findAssigned(
    @Query({ schema: investigationPageSchema }) query: InvestigationPageQuery,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.investigationService.findAssigned(query.page, user);
  }

  @Roles(...CASE_VIEWER_ROLES)
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.investigationService.findOne(id, user);
  }

  @Roles(...INVESTIGATORS)
  @Patch(':id')
  async updateDraft(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: updateInvestigationSchema })
    input: UpdateInvestigationInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.investigationService.updateDraft(id, input, user);
  }

  @Roles(...INVESTIGATORS)
  @Post(':id/submit')
  async submit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.investigationService.submit(id, user);
  }

  @Roles(...CHIEFS)
  @Post(':id/review')
  async review(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: reviewReportSchema }) input: ReviewReportInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.investigationService.review(id, input, user);
  }
}
