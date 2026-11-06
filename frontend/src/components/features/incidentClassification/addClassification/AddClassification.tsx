import useAddClassification from "@/hooks/incidentClassification/useAddClassification";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  type FireIncidentCategoriesInput,
  fireIncidentCategoriesSchema,
} from "@/interface/incidentClassification/incidentClassification";

import Name from "./Name";
import ClassificationType from "./ClassificationType";

const AddClassification = ({
  setOpenAddClassification,
}: {
  setOpenAddClassification: (isOpen: boolean) => void;
}) => {
  const { addNewClassification, isPending } = useAddClassification();

  const methods = useForm<FireIncidentCategoriesInput>({
    resolver: zodResolver(fireIncidentCategoriesSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: FireIncidentCategoriesInput) => {
    await addNewClassification(data);
    setOpenAddClassification(false);
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

export default AddClassification;
