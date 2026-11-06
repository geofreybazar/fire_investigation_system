import { Test, TestingModule } from '@nestjs/testing';
import { FireIncidentSubcategoriesController } from './fire-incident-subcategories.controller.js';
import { FireIncidentSubcategoriesService } from './fire-incident-subcategories.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

describe('FireIncidentSubcategoriesController', () => {
  let controller: FireIncidentSubcategoriesController;
  const service = {
    addFireIncidentSubcategory: vi.fn(),
    getSubcategoryById: vi.fn(),
    editFireIncidentSubcategory: vi.fn(),
    deleteSubcategory: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FireIncidentSubcategoriesController],
      providers: [
        { provide: FireIncidentSubcategoriesService, useValue: service },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FireIncidentSubcategoriesController>(
      FireIncidentSubcategoriesController,
    );
  });

  it('delegates edit and delete to the service', async () => {
    const user = { sub: 'actor-1' } as CurrentUserJwtPayload;

    await controller.editFireIncidentSubcategory(
      'sub-1',
      { name: 'Commercial' },
      user,
    );
    await controller.deleteSubcategory('sub-1', user);

    expect(service.editFireIncidentSubcategory).toHaveBeenCalledWith(
      'sub-1',
      { name: 'Commercial' },
      'actor-1',
    );
    expect(service.deleteSubcategory).toHaveBeenCalledWith('sub-1', 'actor-1');
  });
});
