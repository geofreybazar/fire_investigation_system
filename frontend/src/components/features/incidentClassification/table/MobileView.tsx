import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import Actions from "./Actions";

import ActionDialogs from "./ActionDialogs";

interface MobileViewProps {
  fireIncidentClassifications: FireIncidentCategory[];
}

const MobileView = ({ fireIncidentClassifications }: MobileViewProps) => {
  const [selectedIncidentClassification, setSelectedIncidentClassification] =
    useState<FireIncidentCategory | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  return (
    <>
      {fireIncidentClassifications.map((classification) => (
        <Card key={classification.id}>
          <CardHeader className='flex flex-row items-start justify-between gap-3'>
            <div className='min-w-0'>
              <CardTitle className='truncate text-base'>
                {classification.name}
              </CardTitle>
            </div>

            <Actions
              setOpenView={setOpenView}
              setOpenEdit={setOpenEdit}
              setOpenDelete={setOpenDelete}
              setSelectedIncidentClassification={
                setSelectedIncidentClassification
              }
              classification={classification}
            />
          </CardHeader>

          <CardContent>
            <Separator className='mb-4' />

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>
                  Type
                </p>

                <p className='mt-1 text-sm font-medium'>
                  {classification.type}
                </p>
              </div>

              <div>
                <p className='text-xs font-medium text-muted-foreground'>
                  Sub-Classification
                </p>

                <p className='mt-1 text-sm font-medium'>
                  {classification.subCategories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

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

export default MobileView;
