import { useState } from "react";
import useChangeUserStatus from "@/hooks/users/useChangeUserStatus";

import type { User } from "@/interface/users/users";
import PersonnelRow from "./PersonnelRow";
import EditPersonnel from "../../editPersonnel/EditPersonnel";
import AlertDialogComponent from "@/components/common/AlertDialogComponent";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ViewPersonnel from "../ViewPersonnel/ViewPersonnel";

const DesktopView = ({ users }: { users: User[] }) => {
  const [selectedPersonnel, setSelectedPersonnel] = useState<User>();
  const [openViewPersonnel, setOpenViewPersonnel] = useState(false);
  const [openChangeStatus, setOpenChangeStatus] = useState(false);
  const [openEditUser, setOpenEditUser] = useState(false);

  const { changeUserStatus, isPending } = useChangeUserStatus();

  const action = {
    label: isPending ? "Changing..." : "Change Status",
    onClick: () => {
      if (!selectedPersonnel) {
        throw new Error("Personnel not found");
      }

      changeUserStatus({
        userId: selectedPersonnel.id,
        isActive: !selectedPersonnel.isActive,
      });

      setOpenChangeStatus(false);
    },
  };

  return (
    <div className='hidden md:block'>
      <div className='overflow-hidden rounded-lg border'>
        <Table className='table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[28%]'>Personnel</TableHead>
              <TableHead className='w-[12%]'>Rank</TableHead>
              <TableHead className='w-[20%]'>Position</TableHead>
              <TableHead className='w-[25%]'>Office</TableHead>
              <TableHead className='w-[10%]'>Status</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((personnel) => (
              <PersonnelRow
                key={personnel.id}
                personnel={personnel}
                setSelectedPersonnel={setSelectedPersonnel}
                setOpenViewPersonnel={setOpenViewPersonnel}
                setOpenChangeStatus={setOpenChangeStatus}
                setOpenEditUser={setOpenEditUser}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View modal */}
      <NoButtonDialogComponent
        open={openViewPersonnel}
        modalOnChange={setOpenViewPersonnel}
        dialogTitle='View personnel'
        dialogDescription='View the personnel information.'
        classname='overflow-y-auto md:max-w-3xl'
      >
        <div className='no-scrollbar max-h-[50vh] overflow-y-auto'>
          <ViewPersonnel selectedPersonnel={selectedPersonnel} />
        </div>
      </NoButtonDialogComponent>

      {/* Change status */}
      <AlertDialogComponent
        open={openChangeStatus}
        setOpen={setOpenChangeStatus}
        title={"Change User's status"}
        description={"Are you sure you want to change user's status? "}
        action={action}
      />

      {/* Edit user */}
      <NoButtonDialogComponent
        open={openEditUser}
        modalOnChange={setOpenEditUser}
        dialogTitle='Edit personnel'
        dialogDescription='Edit personnel information.'
        classname='overflow-y-auto md:max-w-3xl'
      >
        <EditPersonnel
          selectedPersonnel={selectedPersonnel}
          setSelectedPersonnel={setSelectedPersonnel}
          setOpenEditUser={setOpenEditUser}
        />
      </NoButtonDialogComponent>
    </div>
  );
};

export default DesktopView;
