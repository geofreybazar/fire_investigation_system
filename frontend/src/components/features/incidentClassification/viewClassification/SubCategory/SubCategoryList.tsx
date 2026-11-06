import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AlertDialogComponent from "@/components/common/AlertDialogComponent";
import useEditSubClassification from "@/hooks/incidentSubClassification/useEditSubClassification";
import useDeleteSubClassification from "@/hooks/incidentSubClassification/useDeleteSubClassification";
import {
  editFireIncidentSubCategorySchema,
  type EditFireIncidentSubCategoryInput,
  type FireIncidentSubCategory,
} from "@/interface/incidentSubClassification/incidentSubClassification";
import Name from "./Name";

const SubCategoryList = ({
  subcategory,
}: {
  subcategory: FireIncidentSubCategory;
}) => {
  const [editing, setEditing] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const { editSubClassification, isPending } = useEditSubClassification();
  const { deleteSubClassification } = useDeleteSubClassification();

  const methods = useForm<EditFireIncidentSubCategoryInput>({
    resolver: zodResolver(editFireIncidentSubCategorySchema),
    defaultValues: { name: subcategory.name },
  });

  const onSubmit = async (data: EditFireIncidentSubCategoryInput) => {
    await editSubClassification({ subcategoryId: subcategory.id, ...data });
    setEditing(false);
  };

  if (editing) {
    return (
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className='space-y-3 rounded-lg border bg-muted/30 p-3'
        >
          <Name />
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                methods.reset({ name: subcategory.name });
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    );
  }

  return (
    <div className='flex items-center gap-3 rounded-lg border p-2'>
      <div className='min-w-0 flex-1'>
        <p className='font-medium'>{subcategory.name}</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='icon-sm'>
              <MoreHorizontal className='size-4' />
              <span className='sr-only'>Open menu</span>
            </Button>
          }
        />
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            className='cursor-pointer'
            onClick={() => setEditing(true)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive cursor-pointer'
            onClick={() => setOpenDelete(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogComponent
        open={openDelete}
        setOpen={setOpenDelete}
        title='Delete subcategory?'
        description={`"${subcategory.name}" will be removed. A subcategory that fire incidents use cannot be deleted.`}
        action={{
          label: "Delete",
          onClick: () => {
            deleteSubClassification(subcategory.id).catch(() => {
              // The hook already shows the error toast.
            });
          },
        }}
      />
    </div>
  );
};

export default SubCategoryList;
