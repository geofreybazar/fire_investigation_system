import { useState } from "react";
import useGetAllOffices from "@/hooks/offices/useGetAllOffices";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface OfficeSelectProps {
  office: { id: string; label: string };
  setOffice: (office: { id: string; label: string }) => void;
  setCurrentPage: (page: number) => void;
}

const OfficeSelect = ({
  office,
  setOffice,
  setCurrentPage,
}: OfficeSelectProps) => {
  const [open, setOpen] = useState(false);
  const { offices } = useGetAllOffices();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-expanded={open}
            variant='outline'
            role='combobox'
            className='w-full justify-between font-normal sm:w-48'
          >
            <span className='truncate'>{office.label || "All offices"}</span>

            <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
          </Button>
        }
      ></PopoverTrigger>

      <PopoverContent
        align='start'
        className='w-[var(--radix-popover-trigger-width)] p-0'
      >
        <Command>
          <CommandInput placeholder='Search office...' />

          <CommandList>
            <CommandEmpty>No office found.</CommandEmpty>

            <CommandGroup>
              {/* All offices */}
              <CommandItem
                value='all'
                onSelect={() => {
                  setOffice({
                    id: "",
                    label: "All offices",
                  });
                  setOpen(false);
                  setCurrentPage(1);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    office.id === "" ? "opacity-100" : "opacity-0",
                  )}
                />
                All offices
              </CommandItem>

              {/* Offices */}
              {offices.map((officeItem) => (
                <CommandItem
                  key={officeItem.id}
                  value={officeItem.name}
                  onSelect={() => {
                    setOffice({
                      id: officeItem.id,
                      label: officeItem.name,
                    });
                    setOpen(false);
                    setCurrentPage(1);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      office.id === officeItem.id ? "opacity-100" : "opacity-0",
                    )}
                  />

                  {officeItem.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default OfficeSelect;
