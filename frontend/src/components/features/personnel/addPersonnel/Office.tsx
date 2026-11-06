import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import useGetAllOffices from "@/hooks/offices/useGetAllOffices";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "cn";

import type { AddNewUserInput } from "@/interface/users/users";

const Office = () => {
  const [open, setOpen] = useState(false);
  const { offices } = useGetAllOffices();

  const { control } = useFormContext<AddNewUserInput>();

  return (
    <Controller
      name='officeId'
      control={control}
      render={({ field, fieldState }) => {
        const selectedOffice = offices.find(
          (office) => office.id === field.value,
        );

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='office'>Office</FieldLabel>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id='office'
                    type='button'
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between font-normal",
                      !selectedOffice && "text-muted-foreground",
                    )}
                  >
                    <span className='truncate'>
                      {selectedOffice?.name ?? "Select office"}
                    </span>

                    <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
                  </Button>
                }
              />

              <PopoverContent
                align='start'
                className='w-[var(--radix-popover-trigger-width)] p-0'
              >
                <Command>
                  <CommandInput placeholder='Search office...' />

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
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              field.value === office.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />

                          {office.name}
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

export default Office;
