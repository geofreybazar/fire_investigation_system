import { useNavigate } from "react-router";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useCreateCase from "@/hooks/cases/useCreateCase";
import useGetCaseFormOptions from "@/hooks/cases/useGetCaseFormOptions";
import {
  newCaseSchema,
  type NewCaseFormValues,
} from "@/interface/case/case";
import { personName } from "@/utils/formatEnum";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { SelectField } from "@/components/common/form/FormFields";
import CaseDetailsFields from "./CaseDetailsFields";
import { caseFieldsPayload } from "./caseFormValues";

// A chief investigator opens a case for a station within their office and
// assigns its first investigation to one of the office's investigators.
const NewCaseForm = ({ onDone }: { onDone: () => void }) => {
  const navigate = useNavigate();
  const { createCase, isPending } = useCreateCase();
  const { stations, investigators, isLoading } = useGetCaseFormOptions();

  const methods = useForm<NewCaseFormValues>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      stationId: "",
      investigatorId: "",
      categoryId: "",
      placeOfOccurence: "",
      barangay: "",
      latitude: null,
      longitude: null,
    },
  });

  const onSubmit = async (values: NewCaseFormValues) => {
    try {
      const created = await createCase({
        stationId: values.stationId,
        investigatorId: values.investigatorId,
        ...caseFieldsPayload(values),
      });
      onDone();
      navigate(`/cases/${created.id}`);
    } catch {
      // The hook already showed the error; keep the form open to fix it.
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1 scrollbar-none'
      >
        <SelectField<NewCaseFormValues>
          name='stationId'
          label='Station where the fire happened'
          placeholder={isLoading ? "Loading..." : "Select station"}
          options={stations.map((station) => ({
            value: station.id,
            label: station.parent
              ? `${station.name} — ${station.parent.name}`
              : station.name,
          }))}
        />
        <SelectField<NewCaseFormValues>
          name='investigatorId'
          label='Assign investigator'
          placeholder={isLoading ? "Loading..." : "Select investigator"}
          options={investigators.map((investigator) => ({
            value: investigator.id,
            label: personName(investigator),
          }))}
        />
        {!isLoading && investigators.length === 0 && (
          <p className='-mt-2 text-sm text-muted-foreground'>
            Your office has no active investigators to assign.
          </p>
        )}

        <Separator />
        <CaseDetailsFields />

        <Button type='submit' disabled={isPending}>
          {isPending ? (
            <>
              <Spinner />
              Opening...
            </>
          ) : (
            "Open case and assign"
          )}
        </Button>
      </form>
    </FormProvider>
  );
};

export default NewCaseForm;
