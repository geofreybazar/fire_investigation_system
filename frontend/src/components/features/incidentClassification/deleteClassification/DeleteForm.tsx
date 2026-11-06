import useDeleteClassification from "@/hooks/incidentClassification/useDeleteClassification";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import { AlertTriangle } from "lucide-react";

interface DeleteFormProps {
  selectedIncidentClassification: FireIncidentCategory;
  setSelectedIncidentClassification: (
    value: FireIncidentCategory | null,
  ) => void;
  setOpenDelete: (value: boolean) => void;
}

const DeleteForm = ({
  selectedIncidentClassification,
  setSelectedIncidentClassification,
  setOpenDelete,
}: DeleteFormProps) => {
  const { deleteClassification, isPending } = useDeleteClassification();

  const handleDeleteClassification = async () => {
    await deleteClassification(selectedIncidentClassification.id);
    setSelectedIncidentClassification(null);
    setOpenDelete(false);
  };

  return (
    <div className='space-y-5'>
      <div className='flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10'>
          <AlertTriangle className='size-5 text-destructive' />
        </div>

        <div className='min-w-0'>
          <h3 className='text-sm font-medium'>Delete this Classification?</h3>

          <p className='mt-1 text-sm text-muted-foreground'>
            This action will permanently delete the selected classification.
            Please make sure this classification is no longer needed.
          </p>
        </div>
      </div>

      <div className='rounded-lg border bg-muted/30 p-4'>
        <p className='text-xs text-muted-foreground'>Classification</p>

        <p className='mt-1 break-words text-sm font-medium'>
          {selectedIncidentClassification.name}
        </p>

        <div className='mt-3 flex items-center gap-2'>
          <p className='text-xs text-muted-foreground'>Type:</p>

          <p className='text-xs font-medium'>
            {selectedIncidentClassification.type}
          </p>
        </div>
      </div>

      <Separator />

      <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            setSelectedIncidentClassification(null);
            setOpenDelete(false);
          }}
          disabled={isPending}
        >
          Cancel
        </Button>

        <Button
          type='button'
          variant='destructive'
          onClick={handleDeleteClassification}
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
