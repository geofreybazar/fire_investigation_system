import { useState } from "react";
import { useNavigate } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import useDeleteCase from "@/hooks/cases/useDeleteCase";
import type { CaseDetail } from "@/interface/case/case";
import { isSuperAdmin } from "@/utils/casePermissions";
import { Button } from "@/components/ui/button";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import DeleteCaseForm from "../form/DeleteCaseForm";
import EditCaseForm from "../form/EditCaseForm";

type OpenDialog = "edit" | "delete" | null;

const ignoreError = () => {}; // The hooks already show the error.

// Edit (creator or handling chief, until an investigation is approved) and
// SUPER_ADMIN deletion. The backend checks both again.
const CaseActions = ({
  investigationCase,
}: {
  investigationCase: CaseDetail;
}) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [open, setOpen] = useState<OpenDialog>(null);
  const { deleteCase, isPending: isDeleting } = useDeleteCase();
  const close = () => setOpen(null);

  const canDelete = isSuperAdmin(user);

  if (!investigationCase.canEdit && !canDelete) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {investigationCase.canEdit && (
        <Button variant='outline' size='sm' onClick={() => setOpen("edit")}>
          <Pencil className='size-4' />
          Edit details
        </Button>
      )}
      {canDelete && (
        <Button
          variant='destructive'
          size='sm'
          onClick={() => setOpen("delete")}
        >
          <Trash2 className='size-4' />
          Delete
        </Button>
      )}

      <NoButtonDialogComponent
        open={open === "edit"}
        modalOnChange={(isOpen) => !isOpen && close()}
        dialogTitle='Edit Case Details'
        dialogDescription='Details lock once an investigation of the case is approved.'
        classname='sm:max-w-2xl'
      >
        <EditCaseForm investigationCase={investigationCase} onDone={close} />
      </NoButtonDialogComponent>

      <NoButtonDialogComponent
        open={open === "delete"}
        modalOnChange={(isOpen) => !isOpen && close()}
        dialogTitle='Delete Case'
        dialogDescription='The case and all its investigations will be hidden. It can be restored from the Deleted tab.'
      >
        <DeleteCaseForm
          isPending={isDeleting}
          onSubmit={({ reason, memoReference }) =>
            deleteCase({ id: investigationCase.id, reason, memoReference })
              .then(() => navigate("/cases"))
              .catch(ignoreError)
          }
        />
      </NoButtonDialogComponent>
    </div>
  );
};

export default CaseActions;
