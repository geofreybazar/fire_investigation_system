import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/interface/users/users";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface ActionsProps {
  personnel: User;
  setSelectedPersonnel: (user: User) => void;
  setOpenViewPersonnel: (isOpen: boolean) => void;
  setOpenChangeStatus: (isOpen: boolean) => void;
  setOpenEditUser: (isOpen: boolean) => void;
}

const Actions = ({
  personnel,
  setSelectedPersonnel,
  setOpenViewPersonnel,
  setOpenChangeStatus,
  setOpenEditUser,
}: ActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='icon' className='size-8'>
            <MoreHorizontal className='size-4' />
            <span className='sr-only'>Open actions</span>
          </Button>
        }
      ></DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          className={"cursor-pointer"}
          onClick={() => {
            setSelectedPersonnel(personnel);
            setOpenViewPersonnel(true);
          }}
        >
          <Eye className='mr-2 size-4' />
          View
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={"cursor-pointer"}
          onClick={() => {
            setSelectedPersonnel(personnel);
            setOpenEditUser(true);
          }}
        >
          <Pencil className='mr-2 size-4' />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className={"cursor-pointer"}
          variant='destructive'
          onClick={() => {
            setSelectedPersonnel(personnel);
            setOpenChangeStatus(true);
          }}
        >
          <Trash2 className='mr-2 size-4' />
          {personnel.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
