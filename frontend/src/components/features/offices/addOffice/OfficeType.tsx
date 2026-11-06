import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OfficeInput } from "@/interface/office/office";
import { OFFICE_TYPES } from "@/constants/office";

const OfficeType = () => {
  const { control } = useFormContext<OfficeInput>();
  const types = OFFICE_TYPES.slice(1);

  return (
    <Controller
      name='type'
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor='type'>Office Type</FieldLabel>

          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id='type'>
              <SelectValue placeholder='Select office type'>
                {
                  OFFICE_TYPES.find((office) => office.value === field.value)
                    ?.label
                }
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {types.map((office) => (
                <SelectItem key={office.value} value={office.value}>
                  {office.label}
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

export default OfficeType;
