import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FireIncidentCategoriesController } from './fire-incident-categories.controller.js';
import { FireIncidentCategoriesService } from './fire-incident-categories.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';

type Handler = keyof FireIncidentCategoriesController;

const roleGuard = new RoleGuard(new Reflector());

const allows = (handler: Handler, role: string) =>
  roleGuard
    .canActivate({
      // Looked up by name: only the function's identity matters to the Reflector.
      getHandler: () =>
        Reflect.get(FireIncidentCategoriesController.prototype, handler),
      getClass: () => FireIncidentCategoriesController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    } as unknown as ExecutionContext)
    .then(
      () => true,
      (error: unknown) => {
        if (error instanceof ForbiddenException) return false;
        throw error;
      },
    );

describe('FireIncidentCategoriesController', () => {
  let controller: FireIncidentCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FireIncidentCategoriesController],
      providers: [{ provide: FireIncidentCategoriesService, useValue: {} }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FireIncidentCategoriesController>(
      FireIncidentCategoriesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it.each([
    // Reads: everyone who views cases, plus NHQ_ADMIN
    ['getPaginatedCategories', 'CITY_MUNICIPALITY_INVESTIGATOR', true],
    ['getPaginatedCategories', 'DISTRICT_PROVINCE_VIEWER', true],
    ['getPaginatedCategories', 'REGIONAL_INVESTIGATOR', true],
    ['getPaginatedCategories', 'NHQ_ADMIN', true],
    ['getPaginatedCategories', 'REGIONAL_ADMIN', false],
    ['getCategoryById', 'CITY_MUNICIPALITY_INVESTIGATOR', true],
    ['getCategoryById', 'REGIONAL_ADMIN', false],
    // Writes: unchanged, NHQ roles only
    ['addFireIncidentCategory', 'NHQ_ADMIN', true],
    ['addFireIncidentCategory', 'CITY_MUNICIPALITY_INVESTIGATOR', false],
    ['editFireIncidentCategory', 'CITY_MUNICIPALITY_INVESTIGATOR', false],
    ['deleteCategory', 'REGIONAL_INVESTIGATOR', false],
  ] as [Handler, string, boolean][])(
    '%s: %s allowed = %s',
    async (handler, role, allowed) => {
      await expect(allows(handler, role)).resolves.toBe(allowed);
    },
  );
});
