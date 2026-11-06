import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import { CaseController } from './case.controller.js';
import { CaseService } from './case.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';

type Handler = keyof CaseController;

const roleGuard = new RoleGuard(new Reflector());

const allows = (handler: Handler, role: string) =>
  roleGuard
    .canActivate({
      // Looked up by name: only the function's identity matters to the Reflector.
      getHandler: () => Reflect.get(CaseController.prototype, handler),
      getClass: () => CaseController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    } as unknown as ExecutionContext)
    .then(
      () => true,
      (error: unknown) => {
        if (error instanceof ForbiddenException) return false;
        throw error;
      },
    );

describe('CaseController', () => {
  let controller: CaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseController],
      providers: [{ provide: CaseService, useValue: {} }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CaseController>(CaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires authentication and role checks on every route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, CaseController)).toEqual([
      AuthGuard,
      RoleGuard,
    ]);
  });

  it.each([
    ['create', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', true],
    ['create', 'REGIONAL_CHIEF_INVESTIGATOR', true],
    ['create', 'NHQ_CHIEF_INVESTIGATOR', true],
    ['create', 'SUPER_ADMIN', true],
    ['create', 'CITY_MUNICIPALITY_INVESTIGATOR', false],
    ['create', 'NHQ_ADMIN', false],
    ['findAll', 'REGIONAL_VIEWER', true],
    ['findAll', 'REGIONAL_ADMIN', false],
    ['findOne', 'CITY_MUNICIPALITY_INVESTIGATOR', true],
    ['findOne', 'NHQ_ADMIN', false],
    ['update', 'DISTRICT_PROVINCE_CHIEF_INVESTIGATOR', true],
    ['update', 'DISTRICT_PROVINCE_INVESTIGATOR', false],
    ['findStations', 'REGIONAL_CHIEF_INVESTIGATOR', true],
    ['findStations', 'REGIONAL_VIEWER', false],
    ['findOwnInvestigators', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', true],
    ['findOwnInvestigators', 'CITY_MUNICIPALITY_INVESTIGATOR', false],
    ['findCandidates', 'REGIONAL_CHIEF_INVESTIGATOR', true],
    ['refer', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', true],
    ['refer', 'CITY_MUNICIPALITY_INVESTIGATOR', false],
    ['start', 'DISTRICT_PROVINCE_CHIEF_INVESTIGATOR', true],
    ['start', 'NHQ_VIEWER', false],
    ['findDeleted', 'SUPER_ADMIN', true],
    ['findDeleted', 'NHQ_CHIEF_INVESTIGATOR', false],
    ['remove', 'SUPER_ADMIN', true],
    ['remove', 'REGIONAL_CHIEF_INVESTIGATOR', false],
    ['restore', 'SUPER_ADMIN', true],
    ['restore', 'NHQ_ADMIN', false],
  ] as [Handler, string, boolean][])(
    '%s: %s allowed = %s',
    async (handler, role, allowed) => {
      await expect(allows(handler, role)).resolves.toBe(allowed);
    },
  );
});
