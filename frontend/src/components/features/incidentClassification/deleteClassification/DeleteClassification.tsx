import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import DeleteForm from "./DeleteForm";

interface DeleteClassificationProps {
  selectedIncidentClassification: FireIncidentCategory | null;
  setSelectedIncidentClassification: (
    value: FireIncidentCategory | null,
  ) => void;
  setOpenDelete: (value: boolean) => void;
}

const DeleteClassification = ({
  selectedIncidentClassification,
  setSelectedIncidentClassification,
  setOpenDelete,
}: DeleteClassificationProps) => {
  if (!selectedIncidentClassification)
    return <span>No classification selected.</span>;

  return (
    <DeleteForm
      selectedIncidentClassification={selectedIncidentClassification}
      setSelectedIncidentClassification={setSelectedIncidentClassification}
      setOpenDelete={setOpenDelete}
    />
  );
};

export default DeleteClassification;
