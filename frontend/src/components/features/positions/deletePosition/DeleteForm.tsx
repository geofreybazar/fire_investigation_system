import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import useDeletePosition from "@/hooks/position/useDeletePosition";
import type { Position } from "@/interface/positions/positions";
import { AlertTriangle } from "lucide-react";

interface DeleteFormProps {
  selectedPosition: Position;
  setSelectedPosition: (o: Position | undefined) => void;
  setOpenDelete: (isOpen: boolean) => void;
}

const DeleteForm = ({
  selectedPosition,
  setSelectedPosition,
  setOpenDelete,
}: DeleteFormProps) => {
  const { deletePosition, isPending } = useDeletePosition();

  const handleDeletePosition = async () => {
    await deletePosition(selectedPosition.id);

    setSelectedPosition(undefined);
    setOpenDelete(false);
  };

  return (
    <div className='space-y-5'>
      <div className='flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10'>
          <AlertTriangle className='size-5 text-destructive' />
        </div>

        <div className='min-w-0'>
          <h3 className='text-sm font-medium'>Delete this position?</h3>

          <p className='mt-1 text-sm text-muted-foreground'>
            This action will permanently delete the selected position. Please
            make sure this position is no longer needed.
          </p>
        </div>
      </div>

      <div className='rounded-lg border bg-muted/30 p-4'>
        <p className='text-xs text-muted-foreground'>Position</p>

        <p className='mt-1 break-words text-sm font-medium'>
          {selectedPosition.name}
        </p>
      </div>

      <Separator />

      <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            setSelectedPosition(undefined);
            setOpenDelete(false);
          }}
          disabled={isPending}
        >
          Cancel
        </Button>

        <Button
          type='button'
          variant='destructive'
          onClick={handleDeletePosition}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Spinner />
              Deleting...
            </>
          ) : (
            "Delete Position"
          )}
        </Button>
      </div>
    </div>
  );
};

export default DeleteForm;
