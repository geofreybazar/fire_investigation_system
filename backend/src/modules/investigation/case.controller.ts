import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CaseService } from './case.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { ROLE } from '../../generated/prisma/enums.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import {
  createCaseSchema,
  deleteCaseSchema,
  listCasesQuerySchema,
  pageQuerySchema,
  updateCaseSchema,
  type CreateCaseInput,
  type DeleteCaseInput,
  type ListCasesQuery,
  type PageQuery,
  type UpdateCaseInput,
} from './schema/case.schema.js';
import {
  referCaseSchema,
  startInvestigationSchema,
  type ReferCaseInput,
  type StartInvestigationInput,
} from './schema/investigation.schema.js';
import { CHIEF_INVESTIGATOR_ROLES } from './utils/investigation-rules.js';
import { CASE_VIEWER_ROLES } from './utils/case-scope.js';

const CHIEFS = [...CHIEF_INVESTIGATOR_ROLES, ROLE.SUPER_ADMIN];

// Investigation cases (docs/REQUIREMENTS.md §4). Every route sets its own
// roles; the class-level list (case viewers) is the default so a new route is
// never left open.
@Roles(...CASE_VIEWER_ROLES)
@UseGuards(AuthGuard, RoleGuard)
@Controller('case')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Roles(...CHIEFS)
  @Post()
  async create(
    @Body({ schema: createCaseSchema }) input: CreateCaseInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.create(input, user);
  }

  @Roles(...CASE_VIEWER_ROLES)
  @Get()
  async findAll(
    @Query({ schema: listCasesQuerySchema }) query: ListCasesQuery,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.findAll(query, user);
  }

  @Roles(ROLE.SUPER_ADMIN)
  @Get('deleted')
  async findDeleted(
    @Query({ schema: pageQuerySchema }) query: PageQuery,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.findDeleted(query.page, user);
  }

  // Stations within the chief's office, for a new case's location.
  @Roles(...CHIEFS)
  @Get('stations')
  async findStations(@CurrentUser() user: CurrentUserJwtPayload) {
    return this.caseService.findStations(user);
  }

  // Investigators of the chief's own office, for a new case.
  @Roles(...CHIEFS)
  @Get('investigators')
  async findOwnInvestigators(@CurrentUser() user: CurrentUserJwtPayload) {
    return this.caseService.findOwnInvestigators(user);
  }

  @Roles(...CASE_VIEWER_ROLES)
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.findOne(id, user);
  }

  @Roles(...CHIEFS)
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: updateCaseSchema }) input: UpdateCaseInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.update(id, input, user);
  }

  @Roles(...CHIEFS)
  @Get(':id/candidates')
  async findCandidates(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.findCandidates(id, user);
  }

  @Roles(...CHIEFS)
  @Post(':id/refer')
  async refer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: referCaseSchema }) input: ReferCaseInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.refer(id, input, user);
  }

  @Roles(...CHIEFS)
  @Post(':id/start')
  async start(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: startInvestigationSchema }) input: StartInvestigationInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.start(id, input, user);
  }

  @Roles(ROLE.SUPER_ADMIN)
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: deleteCaseSchema }) input: DeleteCaseInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.remove(id, input, user);
  }

  @Roles(ROLE.SUPER_ADMIN)
  @Post(':id/restore')
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.caseService.restore(id, user);
  }
}
