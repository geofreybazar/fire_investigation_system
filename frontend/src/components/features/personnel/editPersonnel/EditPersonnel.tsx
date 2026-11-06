import type { User } from "@/interface/users/users";
import PersonnelNotFound from "../table/PersonnelNotFound";
import EditForm from "./EditForm";

interface EditPersonnelProps {
  selectedPersonnel: User | undefined;
  setSelectedPersonnel: (user: User | undefined) => void;
  setOpenEditUser: (isOpen: boolean) => void;
}

const EditPersonnel = ({
  selectedPersonnel,
  setSelectedPersonnel,
  setOpenEditUser,
}: EditPersonnelProps) => {
  if (!selectedPersonnel) {
    return <PersonnelNotFound />;
  }

  return (
    <EditForm
      selectedPersonnel={selectedPersonnel}
      setSelectedPersonnel={setSelectedPersonnel}
      setOpenEditUser={setOpenEditUser}
    />
  );
};

export default EditPersonnel;
