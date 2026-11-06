import useAddPosition from "@/hooks/position/useAddPosition";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  positionSchema,
  type PositionInput,
} from "@/interface/positions/positions";
import Name from "./Name";

const AddPosition = ({
  setOpenAddOffice,
}: {
  setOpenAddOffice: (isOpen: boolean) => void;
}) => {
  const { addNewPosition, isPending } = useAddPosition();

  const methods = useForm<PositionInput>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: PositionInput) => {
    await addNewPosition(data);
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

export default AddPosition;
