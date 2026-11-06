import { FormProvider, useForm } from "react-hook-form";
import useUpdateOffice from "@/hooks/offices/useUpdateOffice";
import { zodResolver } from "@hookform/resolvers/zod";
import { isEqual } from "lodash";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import Name from "../addOffice/Name";
import OfficeType from "../addOffice/OfficeType";
import ParentId from "../addOffice/ParentId";
import RegionCode from "../addOffice/RegionCode";

import {
  officeSchema,
  type Office,
  type OfficeInput,
} from "@/interface/office/office";

interface EditFormProps {
  selectedOffice: Office;
  setSelectedOffice: (o: Office | undefined) => void;
  setOpenEdit: (isOpen: boolean) => void;
}

const EditForm = ({
  selectedOffice,
  setSelectedOffice,
  setOpenEdit,
}: EditFormProps) => {
  const { updateOffice, isPending } = useUpdateOffice();

  // Only regional offices have a region code; leaving the key out for the
  // rest keeps the "nothing changed" comparison below accurate.
  const defaultValues = {
    name: selectedOffice.name,
    parentId: selectedOffice.parentId,
    type: selectedOffice.type,
    ...(selectedOffice.regionCode && { regionCode: selectedOffice.regionCode }),
  };

  const methods = useForm<OfficeInput>({
    resolver: zodResolver(officeSchema),
    defaultValues,
  });

  const onSubmit = async (data: OfficeInput) => {
    const dataWithOfficeId = {
      ...data,
      officeId: selectedOffice.id,
    };

    if (isEqual(defaultValues, data)) {
      setSelectedOffice(undefined);
      setOpenEdit(false);

      return;
    }

    await updateOffice(dataWithOfficeId);
    setSelectedOffice(undefined);
    setOpenEdit(false);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='space-y-3 flex flex-col '
      >
        {/* name */}
        <Name />

        {/* Office Type*/}
        <OfficeType />

        {/* region code */}
        <RegionCode />

        {/* parent office */}
        <ParentId />

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
      </form>
    </FormProvider>
  );
};

export default EditForm;
