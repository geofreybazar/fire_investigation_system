import { Suspense, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "cn";
import useDebounce from "@/hooks/useDebounce";
import useGetClassifications from "@/hooks/incidentClassification/useGetClassifications";
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
import { Skeleton } from "@/components/ui/skeleton";

export interface CategoryOption {
  id: string;
  label: string;
}

interface CategoryFilterProps {
  category: CategoryOption;
  setCategory: (category: CategoryOption) => void;
}

// Categories are paginated, so the search runs on the server instead of
// filtering only the first page.
const CategoryItems = ({
  search,
  category,
  onSelect,
}: {
  search: string;
  category: CategoryOption;
  onSelect: (category: CategoryOption) => void;
}) => {
  const { fireIncidentClassifications } = useGetClassifications(1, search);

  return (
    <>
      <CommandEmpty>No category found.</CommandEmpty>
      <CommandGroup>
        <CommandItem
          value='all'
          onSelect={() => onSelect({ id: "", label: "" })}
        >
          <Check
            className={cn(
              "mr-2 size-4",
              category.id === "" ? "opacity-100" : "opacity-0",
            )}
          />
          All categories
        </CommandItem>
        {fireIncidentClassifications.data.map((item) => (
          <CommandItem
            key={item.id}
            value={item.id}
            onSelect={() => onSelect({ id: item.id, label: item.name })}
          >
            <Check
              className={cn(
                "mr-2 size-4",
                category.id === item.id ? "opacity-100" : "opacity-0",
              )}
            />
            {item.name}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
};

const CategoryFilter = ({ category, setCategory }: CategoryFilterProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-expanded={open}
            variant='outline'
            role='combobox'
            className='w-full justify-between font-normal sm:w-52'
          >
            <span className='truncate'>
              {category.label || "All categories"}
            </span>
            <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
          </Button>
        }
      />
      <PopoverContent align='start' className='w-64 p-0'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search category...'
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <Suspense fallback={<Skeleton className='m-2 h-24' />}>
              <CategoryItems
                search={debouncedSearch}
                category={category}
                onSelect={(selected) => {
                  setCategory(selected);
                  setOpen(false);
                }}
              />
            </Suspense>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryFilter;
