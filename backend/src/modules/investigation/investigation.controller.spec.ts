import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import { InvestigationController } from './investigation.controller.js';
import { InvestigationService } from './investigation.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';

type Handler = keyof InvestigationController;

const roleGuard = new RoleGuard(new Reflector());

const allows = (handler: Handler, role: string) =>
  roleGuard
    .canActivate({
      // Looked up by name: only the function's identity matters to the Reflector.
      getHandler: () => Reflect.get(InvestigationController.prototype, handler),
      getClass: () => InvestigationController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    } as unknown as ExecutionContext)
    .then(
      () => true,
      (error: unknown) => {
        if (error instanceof ForbiddenException) return false;
        throw error;
      },
    );

describe('InvestigationController', () => {
  let controller: InvestigationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestigationController],
      providers: [{ provide: InvestigationService, useValue: {} }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InvestigationController>(InvestigationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires authentication and role checks on every route', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, InvestigationController),
    ).toEqual([AuthGuard, RoleGuard]);
  });

  it.each([
    ['findOne', 'REGIONAL_VIEWER', true],
    ['findOne', 'REGIONAL_ADMIN', false],
    ['findQueue', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', true],
    ['findQueue', 'CITY_MUNICIPALITY_INVESTIGATOR', false],
    ['findAssigned', 'REGIONAL_INVESTIGATOR', true],
    ['findAssigned', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', false],
    ['updateDraft', 'NHQ_INVESTIGATOR', true],
    ['updateDraft', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', false],
    ['submit', 'CITY_MUNICIPALITY_INVESTIGATOR', true],
    ['review', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', true],
    ['review', 'CITY_MUNICIPALITY_INVESTIGATOR', false],
    ['review', 'SUPER_ADMIN', true],
  ] as [Handler, string, boolean][])(
    '%s: %s allowed = %s',
    async (handler, role, allowed) => {
      await expect(allows(handler, role)).resolves.toBe(allowed);
    },
  );
});
