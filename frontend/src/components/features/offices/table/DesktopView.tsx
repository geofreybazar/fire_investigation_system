import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Actions from "./Actions";

import type { Office } from "@/interface/office/office";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import EditOffice from "../editOffice/EditOffice";
import DeleteOffice from "../delteOffice/DeleteOffice";

const DesktopView = ({ offices }: { offices: Office[] }) => {
  const [selectedOffice, setSelectedOffice] = useState<Office>();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[40%]'>Office</TableHead>
            <TableHead className='w-[20%]'>Type</TableHead>
            <TableHead className='w-[35%]'>Parent Office</TableHead>
            <TableHead className='w-12' />
          </TableRow>
        </TableHeader>

        <TableBody>
          {offices.map((office) => {
            const type = office.type
              .split("_")
              .map((t) => t.charAt(0) + t.slice(1).toLowerCase())
              .join(" ");

            return (
              <TableRow key={office.id}>
                <TableCell className='w-[40%]'>
                  <div className='font-medium'>{office.name}</div>
                </TableCell>

                <TableCell className='w-[20%]'>
                  <Badge variant='secondary'>{type}</Badge>
                </TableCell>

                <TableCell className='w-[35%] text-muted-foreground'>
                  {office.parent?.name || "---"}
                </TableCell>

                <TableCell className='w-12'>
                  <Actions
                    setOpenEdit={setOpenEdit}
                    setOpenDelete={setOpenDelete}
                    setSelectedOffice={setSelectedOffice}
                    office={office}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* edit modal */}
      <NoButtonDialogComponent
        open={openEdit}
        modalOnChange={setOpenEdit}
        dialogTitle='Edit Office'
        dialogDescription='Edit the office information.'
      >
        <EditOffice
          selectedOffice={selectedOffice}
          setOpenEdit={setOpenEdit}
          setSelectedOffice={setSelectedOffice}
        />
      </NoButtonDialogComponent>

      {/* delete modal */}
      <NoButtonDialogComponent
        open={openDelete}
        modalOnChange={setOpenDelete}
        dialogTitle='Delete Office'
        dialogDescription='Delete inactive Office.'
      >
        <DeleteOffice
          selectedOffice={selectedOffice}
          setOpenDelete={setOpenDelete}
          setSelectedOffice={setSelectedOffice}
        />
      </NoButtonDialogComponent>
    </>
  );
};

export default DesktopView;
