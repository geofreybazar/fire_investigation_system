import { type Office } from "@/interface/office/office";
import EditForm from "./EditForm";

interface EditOfficeProps {
  selectedOffice: Office | undefined;
  setSelectedOffice: (o: Office | undefined) => void;
  setOpenEdit: (isOpen: boolean) => void;
}

const EditOffice = ({
  selectedOffice,
  setSelectedOffice,
  setOpenEdit,
}: EditOfficeProps) => {
  if (!selectedOffice) return <span>No office selected.</span>;

  return (
    <EditForm
      selectedOffice={selectedOffice}
      setSelectedOffice={setSelectedOffice}
      setOpenEdit={setOpenEdit}
    />
  );
};

export default EditOffice;
