import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";

import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import ViewClassification from "../viewClassification/ViewClassification";
import EditClassification from "../editClassification/EditClassification";
import DeleteClassification from "../deleteClassification/DeleteClassification";

interface ActionDialogsProps {
  selectedIncidentClassification: FireIncidentCategory | null;
  setSelectedIncidentClassification: (
    value: FireIncidentCategory | null,
  ) => void;
  openView: boolean;
  setOpenView: (value: boolean) => void;
  openEdit: boolean;
  setOpenEdit: (value: boolean) => void;
  openDelete: boolean;
  setOpenDelete: (value: boolean) => void;
}

const ActionDialogs = ({
  selectedIncidentClassification,
  setSelectedIncidentClassification,
  openView,
  setOpenView,
  openEdit,
  setOpenEdit,
  openDelete,
  setOpenDelete,
}: ActionDialogsProps) => {
  return (
    <>
      {/* view modal */}
      <NoButtonDialogComponent
        open={openView}
        modalOnChange={setOpenView}
        dialogTitle='View Classification'
        dialogDescription='View the classification information.'
        classname='max-h-[600px] overflow-auto no-scrollbar'
      >
        <ViewClassification
          selectedIncidentClassification={selectedIncidentClassification}
        />
      </NoButtonDialogComponent>

      {/* edit modal */}
      <NoButtonDialogComponent
        open={openEdit}
        modalOnChange={setOpenEdit}
        dialogTitle='Edit Classification'
        dialogDescription='Edit the classification information.'
      >
        <EditClassification
          setOpenEdit={setOpenEdit}
          selectedIncidentClassification={selectedIncidentClassification}
          setSelectedIncidentClassification={setSelectedIncidentClassification}
        />
      </NoButtonDialogComponent>

      {/* delete modal */}
      <NoButtonDialogComponent
        open={openDelete}
        modalOnChange={setOpenDelete}
        dialogTitle='Delete Classification'
        dialogDescription='Delete inactive Classification.'
      >
        <DeleteClassification
          selectedIncidentClassification={selectedIncidentClassification}
          setSelectedIncidentClassification={setSelectedIncidentClassification}
          setOpenDelete={setOpenDelete}
        />
      </NoButtonDialogComponent>
    </>
  );
};

export default ActionDialogs;
