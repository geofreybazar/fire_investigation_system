import type { Position } from "@/interface/positions/positions";
import DeleteForm from "./DeleteForm";

interface DeletePositionProps {
  selectedPosition: Position | undefined;
  setSelectedPosition: (o: Position | undefined) => void;
  setOpenDelete: (isOpen: boolean) => void;
}

const DeletePosition = ({
  selectedPosition,
  setSelectedPosition,
  setOpenDelete,
}: DeletePositionProps) => {
  if (!selectedPosition) return <span>No Position selected.</span>;

  return (
    <DeleteForm
      selectedPosition={selectedPosition}
      setSelectedPosition={setSelectedPosition}
      setOpenDelete={setOpenDelete}
    />
  );
};

export default DeletePosition;
