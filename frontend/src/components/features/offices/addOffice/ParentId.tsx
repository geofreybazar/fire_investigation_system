import { useState } from "react";
import useGetAllOffices from "@/hooks/offices/useGetAllOffices";
import { useFormContext, Controller } from "react-hook-form";

import type { OfficeInput } from "@/interface/office/office";

import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "cn";

const ParentId = () => {
  const [open, setOpen] = useState(false);

  const { offices } = useGetAllOffices();
  const { control } = useFormContext<OfficeInput>();

  return (
    <Controller
      name='parentId'
      control={control}
      render={({ field, fieldState }) => {
        const selectedName =
          offices.find((office) => office.id === field.value)?.name ?? "";

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='parentId'>Parent Office</FieldLabel>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id='parentId'
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between font-normal",
                      fieldState.error && "border-destructive",
                    )}
                  >
                    <span className='truncate'>
                      {selectedName || "Select parent office"}
                    </span>

                    <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
                  </Button>
                }
              ></PopoverTrigger>

              <PopoverContent
                align='start'
                className='w-[var(--radix-popover-trigger-width)] p-0'
              >
                <Command>
                  <CommandInput
                    placeholder='Search office...'
                    className='h-9 '
                  />

                  <CommandList>
                    <CommandEmpty>No office found.</CommandEmpty>

                    <CommandGroup>
                      {offices.map((office) => (
                        <CommandItem
                          key={office.id}
                          value={office.name}
                          onSelect={() => {
                            field.onChange(office.id);
                            setOpen(false);
                          }}
                        >
                          {office.name}

                          <Check
                            className={cn(
                              "ml-auto size-4",
                              field.value === office.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

export default ParentId;
