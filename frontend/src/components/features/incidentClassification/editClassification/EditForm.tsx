import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import useEditClassification from "@/hooks/incidentClassification/useEditClassification";
import { Button } from "@/components/ui/button";
import { isEqual } from "lodash";
import { Spinner } from "@/components/ui/spinner";
import Name from "../addClassification/Name";
import {
  fireIncidentCategoriesSchema,
  type FireIncidentCategoriesInput,
  type FireIncidentCategory,
} from "@/interface/incidentClassification/incidentClassification";
import ClassificationType from "../addClassification/ClassificationType";

interface EditFormProps {
  setOpenEdit: (value: boolean) => void;
  selectedIncidentClassification: FireIncidentCategory;
  setSelectedIncidentClassification: (
    value: FireIncidentCategory | null,
  ) => void;
}

const EditForm = ({
  setOpenEdit,
  selectedIncidentClassification,
  setSelectedIncidentClassification,
}: EditFormProps) => {
  const { editClassification, isPending } = useEditClassification();

  const defaultValues = {
    name: selectedIncidentClassification.name,
    type: selectedIncidentClassification.type,
  };

  const methods = useForm<FireIncidentCategoriesInput>({
    resolver: zodResolver(fireIncidentCategoriesSchema),
    defaultValues,
  });

  const onSubmit = async (data: FireIncidentCategoriesInput) => {
    const dataWithClassificationId = {
      ...data,
      fireIncidentCategoryId: selectedIncidentClassification.id,
    };

    if (isEqual(defaultValues, data)) {
      setSelectedIncidentClassification(null);
      setOpenEdit(false);
      return;
    }

    await editClassification(dataWithClassificationId);
    setSelectedIncidentClassification(null);
    setOpenEdit(false);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='space-y-3 flex flex-col'
      >
        {/* name */}
        <Name />

        {/* type */}
        <ClassificationType />

        <Button type='submit' disabled={isPending} className='mt-4'>
          {isPending ? (
            <>
              <Spinner />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </FormProvider>
  );
};

export default EditForm;
