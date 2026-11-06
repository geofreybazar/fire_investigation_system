import { useState } from "react";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import EditPosition from "../editPosition/EditPosition";
import DeletePosition from "../deletePosition/DeletePosition";
import Actions from "./Actions";

import { Badge } from "@/components/ui/badge";
import type { Position } from "@/interface/positions/positions";

const MobileView = ({ positions }: { positions: Position[] }) => {
  const [selectedPosition, setSelectedPosition] = useState<Position>();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  return (
    <>
      {positions.map((position) => (
        <div key={position.id} className='space-y-4 p-4'>
          {/* Header */}
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate font-medium'>{position.name}</h3>

              <p className='mt-1 text-sm text-muted-foreground'>
                {position.users.length} personnel
              </p>
            </div>

            <Actions
              setOpenEdit={setOpenEdit}
              setOpenDelete={setOpenDelete}
              setSelectedPosition={setSelectedPosition}
              position={position}
            />
          </div>
          {/* Status */}
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>Status</span>

            <Badge variant={position.isActive ? "secondary" : "outline"}>
              {position.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      ))}

      {/* edit modal */}
      <NoButtonDialogComponent
        open={openEdit}
        modalOnChange={setOpenEdit}
        dialogTitle='Edit Position'
        dialogDescription='Edit the position information.'
      >
        <EditPosition
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          setOpenEdit={setOpenEdit}
        />
      </NoButtonDialogComponent>

      {/* delete modal */}
      <NoButtonDialogComponent
        open={openDelete}
        modalOnChange={setOpenDelete}
        dialogTitle='Delete position'
        dialogDescription='Delete inactive poisiton.'
      >
        <DeletePosition
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          setOpenDelete={setOpenDelete}
        />
      </NoButtonDialogComponent>
    </>
  );
};

export default MobileView;
