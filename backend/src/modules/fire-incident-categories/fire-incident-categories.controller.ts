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
import { FireIncidentCategoriesService } from './fire-incident-categories.service.js';
import {
  fireIncidentCategoriesSchema,
  type FireIncidentCategoriesInput,
} from './schema/fire-incident-categories.schema.js';

import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { ROLE } from '../../generated/prisma/enums.js';
import { CASE_VIEWER_ROLES } from '../investigation/utils/case-scope.js';

// Everyone who records or views cases needs to read the classification
// list; NHQ_ADMIN keeps the read access it already had.
const CATEGORY_READER_ROLES = [...CASE_VIEWER_ROLES, ROLE.NHQ_ADMIN];

@Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'NHQ_CHIEF_INVESTIGATOR', 'NHQ_INVESTIGATOR')
@UseGuards(AuthGuard, RoleGuard)
@Controller('fire_incident_categories_api')
export class FireIncidentCategoriesController {
  constructor(
    private readonly fireIncidentCategoriesService: FireIncidentCategoriesService,
  ) {}

  @Post()
  async addFireIncidentCategory(
    @Body({ schema: fireIncidentCategoriesSchema })
    fireIncidentCategoryInput: FireIncidentCategoriesInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.fireIncidentCategoriesService.addFireIncidentCategory(
      fireIncidentCategoryInput,
      user.sub,
    );
  }

  @Roles(...CATEGORY_READER_ROLES)
  @Get()
  async getPaginatedCategories(
    @Query('page') page: number,
    @Query('search') search?: string,
  ) {
    const searchQuery = search || '';

    return this.fireIncidentCategoriesService.getPaginatedCategories(
      page,
      searchQuery,
    );
  }

  @Patch(':id')
  async editFireIncidentCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: fireIncidentCategoriesSchema })
    fireIncidentCategoryInput: FireIncidentCategoriesInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.fireIncidentCategoriesService.editFireIncidentCategory(
      id,
      fireIncidentCategoryInput,
      user.sub,
    );
  }

  @Roles(...CATEGORY_READER_ROLES)
  @Get(':id')
  async getCategoryById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fireIncidentCategoriesService.getCategoryById(id);
  }

  @Delete(':id')
  async deleteCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.fireIncidentCategoriesService.deleteCategory(id, user.sub);
  }
}
