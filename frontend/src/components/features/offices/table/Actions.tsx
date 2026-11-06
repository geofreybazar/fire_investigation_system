import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Office } from "@/interface/office/office";

interface ActionsProps {
  setOpenEdit: (isOpen: boolean) => void;
  setOpenDelete: (isOpen: boolean) => void;
  setSelectedOffice: (office: Office) => void;
  office: Office;
}

const Actions = ({
  setOpenEdit,
  setOpenDelete,
  setSelectedOffice,
  office,
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
            setOpenEdit(true);
            setSelectedOffice(office);
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
            setSelectedOffice(office);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
