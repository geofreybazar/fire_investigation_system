import { Module } from '@nestjs/common';
import { FireIncidentSubcategoriesService } from './fire-incident-subcategories.service.js';
import { FireIncidentSubcategoriesController } from './fire-incident-subcategories.controller.js';
import { FireIncidentSubCategoriesRepository } from './fire-incident-subcategories.repository.js';

@Module({
  controllers: [FireIncidentSubcategoriesController],
  providers: [
    FireIncidentSubcategoriesService,
    FireIncidentSubCategoriesRepository,
  ],
})
export class FireIncidentSubcategoriesModule {}
