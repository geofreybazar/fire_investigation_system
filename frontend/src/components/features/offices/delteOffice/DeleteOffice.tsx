import { type Office } from "@/interface/office/office";
import DeleteForm from "./DeleteForm";

interface DeleteOfficeProps {
  selectedOffice: Office | undefined;
  setSelectedOffice: (o: Office | undefined) => void;
  setOpenDelete: (isOpen: boolean) => void;
}

const DeleteOffice = ({
  selectedOffice,
  setSelectedOffice,
  setOpenDelete,
}: DeleteOfficeProps) => {
  if (!selectedOffice) return <span>No office selected.</span>;

  return (
    <DeleteForm
      selectedOffice={selectedOffice}
      setSelectedOffice={setSelectedOffice}
      setOpenDelete={setOpenDelete}
    />
  );
};

export default DeleteOffice;
