import { useState } from "react";
import useChangeUserStatus from "@/hooks/users/useChangeUserStatus";
import PersonnelCard from "./PersonnelCard";
import type { User } from "@/interface/users/users";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import ViewPersonnel from "../ViewPersonnel/ViewPersonnel";
import AlertDialogComponent from "@/components/common/AlertDialogComponent";
import EditPersonnel from "../../editPersonnel/EditPersonnel";

interface MobileViewProps {
  users: User[];
}

const MobileView = ({ users }: MobileViewProps) => {
  const [openViewPersonnel, setOpenViewPersonnel] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<User>();
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
    <div className='space-y-3 md:hidden'>
      {users.map((personnel) => (
        <PersonnelCard
          key={personnel.id}
          personnel={personnel}
          setSelectedPersonnel={setSelectedPersonnel}
          setOpenViewPersonnel={setOpenViewPersonnel}
          setOpenChangeStatus={setOpenChangeStatus}
          setOpenEditUser={setOpenEditUser}
        />
      ))}

      {/* view modal */}
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

      {/* Deactivate */}
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
        <div className='no-scrollbar max-h-[50vh] overflow-y-auto'>
          <EditPersonnel
            selectedPersonnel={selectedPersonnel}
            setSelectedPersonnel={setSelectedPersonnel}
            setOpenEditUser={setOpenEditUser}
          />
        </div>
      </NoButtonDialogComponent>
    </div>
  );
};

export default MobileView;
