import { Module } from '@nestjs/common';
import { FireIncidentCategoriesService } from './fire-incident-categories.service.js';
import { FireIncidentCategoriesController } from './fire-incident-categories.controller.js';
import { FireIncidentCategoriesRepository } from './fire-incident-categories.repository.js';

@Module({
  controllers: [FireIncidentCategoriesController],
  providers: [FireIncidentCategoriesService, FireIncidentCategoriesRepository],
})
export class FireIncidentCategoriesModule {}
