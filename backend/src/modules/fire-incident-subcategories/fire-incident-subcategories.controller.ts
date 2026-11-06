import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FireIncidentSubcategoriesService } from './fire-incident-subcategories.service.js';
import {
  type EditFireIncidentSubCategoryInput,
  editFireIncidentSubCategorySchema,
  type FireIncidentSubCategoriesInput,
  fireIncidentSubCategoriesSchema,
} from './schema/fire-incident-subcategories.schema.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { ROLE } from '../../generated/prisma/enums.js';
import { CASE_VIEWER_ROLES } from '../investigation/utils/case-scope.js';

// Same reader list as categories (fire-incident-categories.controller.ts).
const SUBCATEGORY_READER_ROLES = [...CASE_VIEWER_ROLES, ROLE.NHQ_ADMIN];

@Roles('SUPER_ADMIN', 'NHQ_ADMIN', 'NHQ_CHIEF_INVESTIGATOR', 'NHQ_INVESTIGATOR')
@UseGuards(AuthGuard, RoleGuard)
@Controller('fire_incident_subcategories_api')
export class FireIncidentSubcategoriesController {
  constructor(
    private readonly fireIncidentSubcategoriesService: FireIncidentSubcategoriesService,
  ) {}

  @Post()
  async addFireIncidentSubcategory(
    @Body({ schema: fireIncidentSubCategoriesSchema })
    fireIncidentSubCategoryInput: FireIncidentSubCategoriesInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.fireIncidentSubcategoriesService.addFireIncidentSubcategory(
      fireIncidentSubCategoryInput,
      user.sub,
    );
  }

  @Roles(...SUBCATEGORY_READER_ROLES)
  @Get(':id')
  async getSubcategoryById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fireIncidentSubcategoriesService.getSubcategoryById(id);
  }

  @Patch(':id')
  async editFireIncidentSubcategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: editFireIncidentSubCategorySchema })
    input: EditFireIncidentSubCategoryInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.fireIncidentSubcategoriesService.editFireIncidentSubcategory(
      id,
      input,
      user.sub,
    );
  }

  @Delete(':id')
  async deleteSubcategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.fireIncidentSubcategoriesService.deleteSubcategory(
      id,
      user.sub,
    );
  }
}
