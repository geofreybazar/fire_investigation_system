import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Position } from "@/interface/positions/positions";

interface ActionsProps {
  setOpenEdit: (isOpen: boolean) => void;
  setOpenDelete: (isOpen: boolean) => void;
  setSelectedPosition: (position: Position) => void;
  position: Position;
}

const Actions = ({
  setOpenEdit,
  setOpenDelete,
  setSelectedPosition,
  position,
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
          className='cursor-pointer'
          onClick={(event) => {
            event.preventDefault();
            setOpenEdit(true);
            setSelectedPosition(position);
          }}
        >
          <Pencil className='mr-2 size-4' />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className='cursor-pointer'
          variant='destructive'
          onClick={(event) => {
            event.preventDefault();
            setOpenDelete(true);
            setSelectedPosition(position);
          }}
        >
          <Trash2 className='mr-2 size-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
