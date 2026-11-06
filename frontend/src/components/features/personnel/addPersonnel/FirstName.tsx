import { useFormContext, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AddNewUserInput } from "@/interface/users/users";

const FirstName = () => {
  const { control } = useFormContext<AddNewUserInput>();

  return (
    <Controller
      name='first_name'
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>First Name</FieldLabel>
          <Input
            {...field}
            placeholder='John'
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default FirstName;
