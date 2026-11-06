import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";

interface ActionsProps {
  setOpenView: (value: boolean) => void;
  setOpenEdit: (value: boolean) => void;
  setOpenDelete: (value: boolean) => void;
  setSelectedIncidentClassification: (
    value: FireIncidentCategory | null,
  ) => void;
  classification: FireIncidentCategory;
}

const Actions = ({
  setOpenView,
  setOpenEdit,
  setOpenDelete,
  setSelectedIncidentClassification,
  classification,
}: ActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        }
      />
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={(event) => {
            event.preventDefault();
            setOpenView(true);
            setSelectedIncidentClassification(classification);
          }}
        >
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={(event) => {
            event.preventDefault();
            setOpenEdit(true);
            setSelectedIncidentClassification(classification);
          }}
        >
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className='text-destructive cursor-pointer'
          onClick={(event) => {
            event.preventDefault();
            setOpenDelete(true);
            setSelectedIncidentClassification(classification);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
