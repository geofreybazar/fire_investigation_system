import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextareaField } from "@/components/common/form/FormFields";

// A single required text field, such as rejection remarks.

const reasonSchema = z.object({
  reason: z.string().trim().min(1, "This field is required").max(1000),
});
type Values = z.infer<typeof reasonSchema>;

interface ReasonFormProps {
  label: string;
  placeholder?: string;
  submitLabel: string;
  destructive?: boolean;
  isPending: boolean;
  onSubmit: (reason: string) => Promise<void>;
}

const ReasonForm = ({
  label,
  placeholder,
  submitLabel,
  destructive = false,
  isPending,
  onSubmit,
}: ReasonFormProps) => {
  const methods = useForm<Values>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit((values) => onSubmit(values.reason))}
        className='flex flex-col gap-3'
      >
        <TextareaField<Values>
          name='reason'
          label={label}
          placeholder={placeholder}
        />
        <Button
          type='submit'
          variant={destructive ? "destructive" : "default"}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </FormProvider>
  );
};

export default ReasonForm;
