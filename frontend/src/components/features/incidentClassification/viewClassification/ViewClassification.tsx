import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import loadable from "@loadable/component";
import ViewUISkeleton from "./ViewUISkeleton";

const ViewUI = loadable(() => import("./ViewUI"), {
  fallback: <ViewUISkeleton />,
});

interface ViewClassificationProps {
  selectedIncidentClassification: FireIncidentCategory | null;
}

const ViewClassification = ({
  selectedIncidentClassification,
}: ViewClassificationProps) => {
  if (!selectedIncidentClassification)
    return <span>No classification selected.</span>;

  return (
    <ViewUI selectedIncidentClassification={selectedIncidentClassification} />
  );
};

export default ViewClassification;
