import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FiltersProps {
  search: string;
  setSearch: (value: string) => void;
  setCurrentPage: (page: number) => void;
}

const Filters = ({ search, setSearch, setCurrentPage }: FiltersProps) => {
  return (
    <div className='flex flex-col gap-3 sm:flex-row rounded-lg border bg-background p-4'>
      <div className='relative flex-1 rounded-lg'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />

        <Input
          placeholder='Search position...'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className='pl-10 '
        />
      </div>
    </div>
  );
};

export default Filters;
