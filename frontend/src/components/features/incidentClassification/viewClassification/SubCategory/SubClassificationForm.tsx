import { FormProvider, useForm } from "react-hook-form";
import useAddSubClassification from "@/hooks/incidentSubClassification/useAddSubClassification";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  fireIncidentSubCategoriesSchema,
  type FireIncidentSubCategoriesInput,
} from "@/interface/incidentSubClassification/incidentSubClassification";
import { Spinner } from "@/components/ui/spinner";
import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import Name from "./Name";

interface SubClassificationFormProps {
  setAddingSubcategory: (value: boolean) => void;
  fireIncidentClassification: FireIncidentCategory;
}

const SubClassificationForm = ({
  setAddingSubcategory,
  fireIncidentClassification,
}: SubClassificationFormProps) => {
  const { addNewSubClassification, isPending } = useAddSubClassification();

  const methods = useForm<FireIncidentSubCategoriesInput>({
    resolver: zodResolver(fireIncidentSubCategoriesSchema),
    defaultValues: {
      name: "",
      categoryId: fireIncidentClassification.id,
    },
  });

  const onSubmit = async (data: FireIncidentSubCategoriesInput) => {
    await addNewSubClassification(data);
    setAddingSubcategory(false);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='mt-4 rounded-lg border bg-muted/30 p-4'
      >
        <div className='mb-4'>
          <h4 className='font-medium'>Add Subcategory</h4>
        </div>

        <div className='space-y-4'>
          <Name />

          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setAddingSubcategory(false)}
            >
              Cancel
            </Button>

            <Button type='submit' disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default SubClassificationForm;
