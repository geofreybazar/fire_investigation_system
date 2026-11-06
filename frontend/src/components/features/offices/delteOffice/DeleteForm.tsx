import useDeleteOffice from "@/hooks/offices/useDeleteOffice";
import { AlertTriangle } from "lucide-react";
import { type Office } from "@/interface/office/office";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

interface DeleteFormProps {
  selectedOffice: Office;
  setSelectedOffice: (o: Office | undefined) => void;
  setOpenDelete: (isOpen: boolean) => void;
}

const DeleteForm = ({
  selectedOffice,
  setSelectedOffice,
  setOpenDelete,
}: DeleteFormProps) => {
  const { deleteOffice, isPending } = useDeleteOffice();

  const handleDeleteOffice = async () => {
    await deleteOffice(selectedOffice.id);

    setSelectedOffice(undefined);
    setOpenDelete(false);
  };

  return (
    <div className='space-y-5'>
      <div className='flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10'>
          <AlertTriangle className='size-5 text-destructive' />
        </div>

        <div className='min-w-0'>
          <h3 className='text-sm font-medium'>Delete this office?</h3>

          <p className='mt-1 text-sm text-muted-foreground'>
            This action will permanently delete the selected office. Please make
            sure this office is no longer needed.
          </p>
        </div>
      </div>

      <div className='rounded-lg border bg-muted/30 p-4'>
        <p className='text-xs text-muted-foreground'>Office</p>

        <p className='mt-1 break-words text-sm font-medium'>
          {selectedOffice.name}
        </p>

        <div className='mt-3 flex items-center gap-2'>
          <p className='text-xs text-muted-foreground'>Type:</p>

          <p className='text-xs font-medium'>
            {selectedOffice.type
              .split("_")
              .map((value) => value.charAt(0) + value.slice(1).toLowerCase())
              .join(" ")}
          </p>
        </div>
      </div>

      <Separator />

      <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            setSelectedOffice(undefined);
            setOpenDelete(false);
          }}
          disabled={isPending}
        >
          Cancel
        </Button>

        <Button
          type='button'
          variant='destructive'
          onClick={handleDeleteOffice}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Spinner />
              Deleting...
            </>
          ) : (
            "Delete Office"
          )}
        </Button>
      </div>
    </div>
  );
};

export default DeleteForm;
