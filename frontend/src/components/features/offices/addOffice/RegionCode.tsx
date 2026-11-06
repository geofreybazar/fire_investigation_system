import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const RegionCode = () => {
  const { control } = useFormContext();

  const officeType = useWatch({
    control,
    name: "type",
  });
  return (
    <>
      {officeType === "REGIONAL_OFFICE" && (
        <Controller
          control={control}
          name='regionCode'
          // Drop the value when the field is hidden, so a code typed before
          // switching away from Regional Office isn't submitted.
          shouldUnregister
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Region Code</FieldLabel>

              <Input
                placeholder='e.g. NCR, RI, RII'
                autoComplete='off'
                {...field}
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(event.target.value.toUpperCase())
                }
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
    </>
  );
};

export default RegionCode;
