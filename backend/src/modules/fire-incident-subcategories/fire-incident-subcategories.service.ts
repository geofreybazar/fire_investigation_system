import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type EditFireIncidentSubCategoryInput,
  FireIncidentSubCategoriesInput,
} from './schema/fire-incident-subcategories.schema.js';
import { FireIncidentSubCategoriesRepository } from './fire-incident-subcategories.repository.js';

@Injectable()
export class FireIncidentSubcategoriesService {
  constructor(
    private readonly fireIncidentSubCategoriesRepository: FireIncidentSubCategoriesRepository,
  ) {}

  private readonly logger = new Logger();

  async addFireIncidentSubcategory(
    fireIncidentSubCategoryInput: FireIncidentSubCategoriesInput,
    actorId: string,
  ) {
    this.logger.log('Adding new fire incident sub-category');
    return await this.fireIncidentSubCategoriesRepository.addFireIncidentSubcategory(
      fireIncidentSubCategoryInput,
      actorId,
    );
  }

  async getSubcategoryById(id: string) {
    const subcategory =
      await this.fireIncidentSubCategoriesRepository.getSubcategoryById(id);

    if (!subcategory) {
      throw new NotFoundException('Sub category not found.');
    }

    return subcategory;
  }

  async editFireIncidentSubcategory(
    id: string,
    input: EditFireIncidentSubCategoryInput,
    actorId: string,
  ) {
    await this.getSubcategoryById(id);

    this.logger.log(`Editing fire incident sub-category: ${id}`);
    return this.fireIncidentSubCategoriesRepository.editFireIncidentSubcategory(
      id,
      input,
      actorId,
    );
  }

  async deleteSubcategory(id: string, actorId: string) {
    const subcategory = await this.getSubcategoryById(id);

    // The foreign key would silently null the cases' subcategory, so the
    // check has to happen here. The count includes soft-deleted cases.
    if (subcategory._count.cases > 0) {
      throw new ConflictException(
        'This sub category cannot be deleted because investigation cases use it.',
      );
    }

    await this.fireIncidentSubCategoriesRepository.deleteById(id, actorId);

    return {
      message: 'Sub category deleted successfully.',
    };
  }
}
