import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FireIncidentCategoriesInput } from "@/interface/incidentClassification/incidentClassification";
import { CATEGORY_TYPE } from "@/constants/classification";

const ClassificationType = () => {
  const { control } = useFormContext<FireIncidentCategoriesInput>();
  return (
    <Controller
      name='type'
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor='type'>Type</FieldLabel>

          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id='type'>
              <SelectValue placeholder='select type' />
            </SelectTrigger>

            <SelectContent>
              {CATEGORY_TYPE.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className='cursor-pointer'
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default ClassificationType;
