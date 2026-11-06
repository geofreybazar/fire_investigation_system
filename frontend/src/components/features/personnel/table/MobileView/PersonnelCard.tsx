import type { User } from "@/interface/users/users";
import { UserRound } from "lucide-react";
import Actions from "../Actions";
import { Badge } from "@/components/ui/badge";

interface PersonnelRowProps {
  personnel: User;
  setSelectedPersonnel: (user: User) => void;
  setOpenViewPersonnel: (isOpen: boolean) => void;
  setOpenChangeStatus: (isOpen: boolean) => void;
  setOpenEditUser: (isOpen: boolean) => void;
}

const PersonnelCard = ({
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
    <div className='rounded-lg border bg-background p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted'>
            <UserRound className='size-5 text-muted-foreground' />
          </div>

          <div className='min-w-0'>
            <p className='truncate font-medium'>{fullName}</p>

            <p className='text-xs text-muted-foreground'>
              {personnel.account_number}
            </p>
          </div>
        </div>

        <Actions
          personnel={personnel}
          setSelectedPersonnel={setSelectedPersonnel}
          setOpenViewPersonnel={setOpenViewPersonnel}
          setOpenChangeStatus={setOpenChangeStatus}
          setOpenEditUser={setOpenEditUser}
        />
      </div>

      <div className='mt-4 grid grid-cols-2 gap-4 border-t pt-4'>
        <div>
          <p className='text-xs text-muted-foreground'>Rank</p>

          <p className='mt-1 text-sm font-medium'>{personnel.rank}</p>
        </div>

        <div>
          <p className='text-xs text-muted-foreground'>Status</p>

          <div className='mt-1'>
            {personnel.isActive === true ? (
              <Badge variant='outline'>Active</Badge>
            ) : (
              <Badge variant='destructive'>Inactive</Badge>
            )}
          </div>
        </div>

        <div className='col-span-2'>
          <p className='text-xs text-muted-foreground'>Position</p>

          <p className='mt-1 text-sm'>{personnel.position.name}</p>
        </div>

        <div className='col-span-2'>
          <p className='text-xs text-muted-foreground'>Office</p>

          <p className='mt-1 text-sm'>{personnel.office.name}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonnelCard;
