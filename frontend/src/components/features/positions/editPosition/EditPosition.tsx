import type { Position } from "@/interface/positions/positions";
import EditForm from "./EditForm";

interface EditPositionProps {
  selectedPosition: Position | undefined;
  setSelectedPosition: (position: Position | undefined) => void;
  setOpenEdit: (isOpen: boolean) => void;
}

const EditPosition = ({
  selectedPosition,
  setOpenEdit,
  setSelectedPosition,
}: EditPositionProps) => {
  if (!selectedPosition) return <span>No position selected.</span>;

  return (
    <EditForm
      selectedPosition={selectedPosition}
      setSelectedPosition={setSelectedPosition}
      setOpenEdit={setOpenEdit}
    />
  );
};

export default EditPosition;
