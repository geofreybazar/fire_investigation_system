import { useState } from "react";
import useGetClassification from "@/hooks/incidentClassification/useGetClassification";

import { Separator } from "@/components/ui/separator";

import type { FireIncidentCategory } from "@/interface/incidentClassification/incidentClassification";
import { Badge } from "@/components/ui/badge";
import SubCategories from "./SubCategory/SubCategories";

const ViewUI = ({
  selectedIncidentClassification,
}: {
  selectedIncidentClassification: FireIncidentCategory;
}) => {
  const { fireIncidentClassification } = useGetClassification(
    selectedIncidentClassification.id,
  );

  const [addingSubcategory, setAddingSubcategory] = useState(false);

  return (
    <div className='space-y-6'>
      {/* Classification Information */}
      <div className='flex items-start gap-4'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-xl font-semibold'>
              {fireIncidentClassification.name}
            </h2>
          </div>

          <p className='mt-1 text-sm text-muted-foreground'>
            Incident Classification
          </p>
        </div>
        <Badge>{fireIncidentClassification.type}</Badge>
      </div>

      <Separator />

      {/* Subcategories */}
      <SubCategories
        addingSubcategory={addingSubcategory}
        setAddingSubcategory={setAddingSubcategory}
        fireIncidentClassification={fireIncidentClassification}
      />
    </div>
  );
};

export default ViewUI;
