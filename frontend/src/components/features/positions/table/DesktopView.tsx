import { useState } from "react";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import Actions from "./Actions";
import EditPosition from "../editPosition/EditPosition";
import DeletePosition from "../deletePosition/DeletePosition";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Position } from "@/interface/positions/positions";

const DesktopView = ({ positions }: { positions: Position[] }) => {
  const [selectedPosition, setSelectedPosition] = useState<Position>();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      <Table className='table-fixed'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[40%]'>Position</TableHead>

            <TableHead className='w-[20%]'>Personnel</TableHead>

            <TableHead className='w-[25%]'>Status</TableHead>

            <TableHead className='w-[15%] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              {/* Position */}
              <TableCell>
                <div className='truncate font-medium'>{position.name}</div>
              </TableCell>

              {/* Personnel */}
              <TableCell>
                <span className='text-sm text-muted-foreground'>
                  {position.users.length}{" "}
                  {position.users.length === 1 ? "personnel" : "personnel"}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge
                  variant={position.isActive ? "secondary" : "outline"}
                  className={
                    position.isActive ? "capitalize" : "text-muted-foreground"
                  }
                >
                  {position.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell>
                <div className='flex justify-end'>
                  <Actions
                    setOpenEdit={setOpenEdit}
                    setOpenDelete={setOpenDelete}
                    setSelectedPosition={setSelectedPosition}
                    position={position}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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

export default DesktopView;
