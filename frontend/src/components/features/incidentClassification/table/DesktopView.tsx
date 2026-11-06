import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import Actions from "./Actions";

import ActionDialogs from "./ActionDialogs";

const DesktopView = ({
  fireIncidentClassifications,
}: {
  fireIncidentClassifications: FireIncidentCategory[];
}) => {
  const [selectedIncidentClassification, setSelectedIncidentClassification] =
    useState<FireIncidentCategory | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      <Table className='table-fixed'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[28%]'>Classification</TableHead>
            <TableHead className='w-[28%]'>Type</TableHead>

            <TableHead className='w-[28%]'>Sub-Classification</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {fireIncidentClassifications.map((classification) => (
            <TableRow key={classification.id}>
              <TableCell className='font-medium'>
                {classification.name}
              </TableCell>

              <TableCell className='font-medium'>
                {classification.type}
              </TableCell>

              <TableCell className='font-medium'>
                {classification.subCategories.length}
              </TableCell>

              <TableCell className='text-right'>
                <Actions
                  setOpenView={setOpenView}
                  setOpenEdit={setOpenEdit}
                  setOpenDelete={setOpenDelete}
                  setSelectedIncidentClassification={
                    setSelectedIncidentClassification
                  }
                  classification={classification}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ActionDialogs
        selectedIncidentClassification={selectedIncidentClassification}
        setSelectedIncidentClassification={setSelectedIncidentClassification}
        openView={openView}
        setOpenView={setOpenView}
        openEdit={openEdit}
        setOpenEdit={setOpenEdit}
        openDelete={openDelete}
        setOpenDelete={setOpenDelete}
      />
    </>
  );
};

export default DesktopView;
