import { useFormContext, Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AddNewUserInput } from "@/interface/users/users";

const Email = () => {
  const { control } = useFormContext<AddNewUserInput>();

  return (
    <Controller
      name='email'
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Email</FieldLabel>
          <Input
            {...field}
            placeholder='johndoe@gmail.com'
            aria-invalid={fieldState.invalid}
            type='email'
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default Email;
