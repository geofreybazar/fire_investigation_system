import { useFormContext, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AddNewUserInput } from "@/interface/users/users";

const MiddleName = () => {
  const { control } = useFormContext<AddNewUserInput>();

  return (
    <Controller
      name='middle_name'
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Middle Name</FieldLabel>
          <Input
            {...field}
            placeholder='Rontos'
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default MiddleName;
