import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useUpdateCase from "@/hooks/cases/useUpdateCase";
import {
  editCaseSchema,
  type CaseDetail,
  type EditCaseFormValues,
} from "@/interface/case/case";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import CaseDetailsFields from "./CaseDetailsFields";
import { caseFieldsPayload, editDefaults } from "./caseFormValues";

const EditCaseForm = ({
  investigationCase,
  onDone,
}: {
  investigationCase: CaseDetail;
  onDone: () => void;
}) => {
  const { updateCase, isPending } = useUpdateCase();

  const methods = useForm<EditCaseFormValues>({
    resolver: zodResolver(editCaseSchema),
    defaultValues: editDefaults(investigationCase),
  });

  const onSubmit = async (values: EditCaseFormValues) => {
    try {
      await updateCase({
        id: investigationCase.id,
        data: caseFieldsPayload(values),
      });
      onDone();
    } catch {
      // The hook already showed the error; keep the form open to fix it.
    }
  };

  const { category, subcategory } = investigationCase;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1'
      >
        <CaseDetailsFields
          current={{
            category: { value: category.id, label: category.name },
            subcategory: subcategory
              ? { value: subcategory.id, label: subcategory.name }
              : undefined,
          }}
        />

        <Button type='submit' disabled={isPending}>
          {isPending ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </FormProvider>
  );
};

export default EditCaseForm;
