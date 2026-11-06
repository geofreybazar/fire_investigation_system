import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Actions from "./Actions";

import type { Office } from "@/interface/office/office";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import EditOffice from "../editOffice/EditOffice";
import DeleteOffice from "../delteOffice/DeleteOffice";

const MobileView = ({ offices }: { offices: Office[] }) => {
  const [selectedOffice, setSelectedOffice] = useState<Office>();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      {offices.map((office) => {
        const type = office.type
          .split("_")
          .map((t) => t.charAt(0) + t.slice(1).toLowerCase())
          .join(" ");

        return (
          <div key={office.id} className='rounded-lg border bg-card p-4'>
            {/* Header */}
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-xs text-muted-foreground'>Office</p>

                <h3 className='font-medium text-wrap'>{office.name}</h3>
              </div>

              {/* Action Menu */}
              <Actions
                setOpenEdit={setOpenEdit}
                setOpenDelete={setOpenDelete}
                setSelectedOffice={setSelectedOffice}
                office={office}
              />
            </div>

            {/* Details */}
            <div className='mt-4 grid grid-cols-2 gap-4'>
              <div>
                <p className='text-xs text-muted-foreground'>Type</p>

                <div className='mt-1 truncate'>
                  <Badge variant='secondary'>{type}</Badge>
                </div>
              </div>

              <div>
                <p className='text-xs text-muted-foreground'>Parent Office</p>

                <p className='mt-1 text-sm text-wrap'>
                  {office.parentId || "---"}
                </p>
              </div>
            </div>
          </div>
        );
      })}

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

export default MobileView;
