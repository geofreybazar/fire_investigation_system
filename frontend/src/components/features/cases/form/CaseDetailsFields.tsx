import { IMPACT_FIELDS, type EditCaseFormValues } from "@/interface/case/case";
import { Separator } from "@/components/ui/separator";
import {
  NumberField,
  TextField,
  TextareaField,
  type Option,
} from "@/components/common/form/FormFields";
import CategoryFields from "./CategoryFields";

// Category, location, dates and impact: the fields shared by the new-case
// and edit forms. Provisional until the official BFP forms are available.
const CaseDetailsFields = ({
  current,
}: {
  current?: { category?: Option; subcategory?: Option };
}) => (
  <>
    <CategoryFields current={current} />

    <Separator />
    <p className='text-sm font-medium'>Location</p>
    <p className='-mt-3 text-xs text-muted-foreground'>
      Region, province/district and city/municipality are taken from the
      station.
    </p>
    <TextField<EditCaseFormValues>
      name='placeOfOccurence'
      label='Place of occurrence'
      placeholder='Street, building or landmark'
    />
    <TextField<EditCaseFormValues> name='barangay' label='Barangay' />
    <div className='grid gap-3 sm:grid-cols-2'>
      <NumberField<EditCaseFormValues>
        name='latitude'
        label='Latitude (optional)'
      />
      <NumberField<EditCaseFormValues>
        name='longitude'
        label='Longitude (optional)'
      />
    </div>

    <Separator />
    <p className='text-sm font-medium'>Dates (optional)</p>
    <div className='grid gap-3 sm:grid-cols-3'>
      <TextField<EditCaseFormValues>
        name='dateTimeFireIncident'
        label='Fire incident'
        type='datetime-local'
      />
      <TextField<EditCaseFormValues>
        name='dateTimeCallReceived'
        label='Call received'
        type='datetime-local'
      />
      <TextField<EditCaseFormValues>
        name='dateTimeReported'
        label='Reported'
        type='datetime-local'
      />
    </div>

    <Separator />
    <p className='text-sm font-medium'>Impact (optional)</p>
    <div className='grid gap-3 sm:grid-cols-2'>
      {IMPACT_FIELDS.map(([key, label]) => (
        <NumberField<EditCaseFormValues>
          key={key}
          name={key}
          label={label}
          {...(!key.endsWith("Damages") && { step: "1" })}
        />
      ))}
    </div>

    <TextareaField<EditCaseFormValues>
      name='remarks'
      label='Remarks (optional)'
    />
  </>
);

export default CaseDetailsFields;
