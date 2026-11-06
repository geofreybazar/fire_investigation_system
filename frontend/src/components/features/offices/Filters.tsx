import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OFFICE_TYPES } from "@/constants/office";

interface FiltersProps {
  search: string;
  setSearch: (value: string) => void;
  officeType: { value: string; label: string };
  setOfficeType: (officeType: { value: string; label: string }) => void;
  setCurrentPage: (page: number) => void;
}

const Filters = ({
  setSearch,
  search,
  officeType,
  setOfficeType,
  setCurrentPage,
}: FiltersProps) => {
  return (
    <div className='flex flex-col gap-3 sm:flex-row rounded-lg border bg-background p-4'>
      <div className='relative flex-1 rounded-lg'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />

        <Input
          placeholder='Search offices...'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className='pl-10 '
        />
      </div>

      <Select
        value={officeType.label}
        onValueChange={(value) => {
          const selectedType = OFFICE_TYPES.find(
            (type) => type.value === value,
          );
          setOfficeType(
            selectedType ?? {
              value: "ALL",
              label: "All types",
            },
          );
          setCurrentPage(1);
        }}
      >
        <SelectTrigger className='w-full sm:w-48 cursor-pointer'>
          <SelectValue placeholder='Office type' className='cursor-pointer' />
        </SelectTrigger>

        <SelectContent>
          {OFFICE_TYPES.map((type) => (
            <SelectItem value={type.value} className='cursor-pointer'>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Filters;
