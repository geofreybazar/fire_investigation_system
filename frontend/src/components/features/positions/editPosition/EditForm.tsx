import useUpdatePosition from "@/hooks/position/useUpdatePosition";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trim, isEqual } from "lodash";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  positionSchema,
  type Position,
  type PositionInput,
} from "@/interface/positions/positions";

import Name from "../addPosition/Name";

interface EditFormProps {
  selectedPosition: Position;
  setSelectedPosition: (position: Position | undefined) => void;
  setOpenEdit: (isOpen: boolean) => void;
}

const EditForm = ({
  selectedPosition,
  setSelectedPosition,
  setOpenEdit,
}: EditFormProps) => {
  const { updatePosition, isPending } = useUpdatePosition();

  const methods = useForm<PositionInput>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: selectedPosition.name,
    },
  });

  const onSubmit = async (data: PositionInput) => {
    const dataWithPositionId = {
      ...data,
      positionId: selectedPosition.id,
    };

    if (
      isEqual(
        trim(data.name).toLowerCase(),
        trim(selectedPosition.name).toLowerCase(),
      )
    ) {
      setSelectedPosition(undefined);
      setOpenEdit(false);

      return;
    }

    await updatePosition(dataWithPositionId);
    setSelectedPosition(undefined);
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
