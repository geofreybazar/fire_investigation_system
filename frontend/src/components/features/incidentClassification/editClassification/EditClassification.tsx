import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import EditForm from "./EditForm";

interface EditClassificationProps {
  setOpenEdit: (value: boolean) => void;
  selectedIncidentClassification: FireIncidentCategory | null;
  setSelectedIncidentClassification: (
    value: FireIncidentCategory | null,
  ) => void;
}

const EditClassification = ({
  setOpenEdit,
  selectedIncidentClassification,
  setSelectedIncidentClassification,
}: EditClassificationProps) => {
  if (!selectedIncidentClassification)
    return <span>No classification selected.</span>;

  return (
    <EditForm
      setOpenEdit={setOpenEdit}
      selectedIncidentClassification={selectedIncidentClassification}
      setSelectedIncidentClassification={setSelectedIncidentClassification}
    />
  );
};

export default EditClassification;
