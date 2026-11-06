import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import useGetAllPositions from "@/hooks/position/useGetAllPositions";

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

const Position = () => {
  const [open, setOpen] = useState(false);
  const { positions } = useGetAllPositions();

  const { control } = useFormContext<AddNewUserInput>();

  return (
    <Controller
      name='positionId'
      control={control}
      render={({ field, fieldState }) => {
        const selectedPosition = positions.find(
          (position) => position.id === field.value,
        );

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='position'>Position</FieldLabel>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id='position'
                    type='button'
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between font-normal",
                      !selectedPosition && "text-muted-foreground",
                    )}
                  >
                    <span className='truncate'>
                      {selectedPosition?.name ?? "Select position"}
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
                  <CommandInput placeholder='Search position...' />

                  <CommandList>
                    <CommandEmpty>No position found.</CommandEmpty>

                    <CommandGroup>
                      {positions.map((position) => (
                        <CommandItem
                          key={position.id}
                          value={position.name}
                          onSelect={() => {
                            field.onChange(position.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              field.value === position.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />

                          {position.name}
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

export default Position;
