import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import Actions from "../Actions";

import type { User } from "@/interface/users/users";

interface PersonnelRowProps {
  personnel: User;
  setSelectedPersonnel: (user: User) => void;
  setOpenViewPersonnel: (isOpen: boolean) => void;
  setOpenChangeStatus: (isOpen: boolean) => void;
  setOpenEditUser: (isOpen: boolean) => void;
}

const PersonnelRow = ({
  personnel,
  setSelectedPersonnel,
  setOpenViewPersonnel,
  setOpenChangeStatus,
  setOpenEditUser,
}: PersonnelRowProps) => {
  const fullName = [
    personnel.rank,
    personnel.first_name,
    personnel.middle_name ? personnel.middle_name.charAt(0) : " ",
    personnel.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TableRow>
      {/* Personnel */}

      <TableCell>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='min-w-0'>
            <p className='truncate font-medium'>{fullName}</p>

            <p className='truncate text-xs text-muted-foreground'>
              {personnel.account_number}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Rank */}

      <TableCell>
        <span className='font-medium'>{personnel.rank}</span>
      </TableCell>

      {/* Position */}

      <TableCell>
        <span className='block truncate'>{personnel.position.name}</span>
      </TableCell>

      {/* Office */}

      <TableCell>
        <span className='block truncate text-muted-foreground'>
          {personnel.office.name}
        </span>
      </TableCell>

      {/* Status */}

      <TableCell>
        {personnel.isActive === true ? (
          <Badge variant='outline'>Active</Badge>
        ) : (
          <Badge variant='destructive'>Inactive</Badge>
        )}
      </TableCell>

      {/* Actions */}

      <TableCell>
        <Actions
          personnel={personnel}
          setSelectedPersonnel={setSelectedPersonnel}
          setOpenViewPersonnel={setOpenViewPersonnel}
          setOpenChangeStatus={setOpenChangeStatus}
          setOpenEditUser={setOpenEditUser}
        />
      </TableCell>
    </TableRow>
  );
};

export default PersonnelRow;
