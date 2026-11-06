import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { FireIncidentCategoriesInput } from "@/interface/incidentClassification/incidentClassification";

const Name = () => {
  const { control } = useFormContext<FireIncidentCategoriesInput>();

  return (
    <Controller
      name='name'
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Name</FieldLabel>
          <Input
            {...field}
            placeholder='Name'
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default Name;
