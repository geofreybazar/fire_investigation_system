import SubClassificationForm from "./SubClassificationForm";
import NoSubCategory from "./NoSubCategory";
import SubCategoryList from "./SubCategoryList";
import AddSubCategory from "./AddSubCategory";

import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";

interface SubCategoriesProps {
  addingSubcategory: boolean;
  setAddingSubcategory: (value: boolean) => void;
  fireIncidentClassification: FireIncidentCategory;
}

const SubCategories = ({
  addingSubcategory,
  setAddingSubcategory,
  fireIncidentClassification,
}: SubCategoriesProps) => {
  return (
    <div>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h3 className='font-semibold'>Subcategories</h3>
          <p className='text-sm text-muted-foreground'>
            Manage subcategories under this classification.
          </p>
        </div>

        {!addingSubcategory && (
          <AddSubCategory setAddingSubcategory={setAddingSubcategory} />
        )}
      </div>

      {/* Add Subcategory Form */}
      {addingSubcategory && (
        <SubClassificationForm
          setAddingSubcategory={setAddingSubcategory}
          fireIncidentClassification={fireIncidentClassification}
        />
      )}

      {/* Subcategory List */}
      {!addingSubcategory && (
        <div className='mt-4 space-y-3'>
          {fireIncidentClassification.subCategories.length === 0 ? (
            <NoSubCategory />
          ) : (
            fireIncidentClassification.subCategories.map((subcategory) => (
              <SubCategoryList key={subcategory.id} subcategory={subcategory} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SubCategories;
