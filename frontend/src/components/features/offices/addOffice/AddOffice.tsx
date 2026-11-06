import useAddOffice from "@/hooks/offices/useAddOffice";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { officeSchema, type OfficeInput } from "@/interface/office/office";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import Name from "./Name";
import ParentId from "./ParentId";
import OfficeType from "./OfficeType";
import RegionCode from "./RegionCode";

const AddOffice = ({
  setOpenAddOffice,
}: {
  setOpenAddOffice: (isOpen: boolean) => void;
}) => {
  const { addNewOffice, isPending } = useAddOffice();

  const methods = useForm<OfficeInput>({
    resolver: zodResolver(officeSchema),
    defaultValues: {
      name: "",
      parentId: undefined,
      type: undefined,
    },
  });

  const onSubmit = async (data: OfficeInput) => {
    await addNewOffice(data);
    setOpenAddOffice(false);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='space-y-3 flex flex-col'
      >
        {/* name */}
        <Name />

        {/* Office Type*/}
        <OfficeType />

        {/* region code */}
        <RegionCode />

        {/* parent office */}
        <ParentId />

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

export default AddOffice;
