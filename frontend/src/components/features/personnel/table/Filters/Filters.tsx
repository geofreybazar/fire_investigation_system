import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ErrorBoundary } from "react-error-boundary";
import loadable from "@loadable/component";
import { Skeleton } from "@/components/ui/skeleton";

import { type Rank } from "@/constants/personnel";
import OfficeSelectError from "./OfficeSelectError";

import RankSelect from "./RankSelect";
import StatusSelect from "./StatusSelect";

const OfficeSelect = loadable(() => import("./OfficeSelect"), {
  fallback: <Skeleton className='h-10 w-full rounded-md sm:w-48' />,
});

interface FiltersProps {
  search: string;
  setSearch: (value: string) => void;
  office: { id: string; label: string };
  setOffice: (office: { id: string; label: string }) => void;
  rank: Rank | undefined;
  setRank: (rank: Rank | undefined) => void;
  status: string;
  setStatus: (status: "Active" | "Inactive") => void;
  setCurrentPage: (page: number) => void;
}

const Filters = ({
  search,
  setSearch,
  office,
  setOffice,
  rank,
  setRank,
  status,
  setStatus,
  setCurrentPage,
}: FiltersProps) => {
  return (
    <div className='flex flex-col gap-3 sm:flex-row rounded-lg border bg-background p-4'>
      <div className='relative flex-1 rounded-lg'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />

        <Input
          placeholder='Search personnel...'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className='pl-10 '
        />
      </div>

      {/* rank */}
      <RankSelect rank={rank} setRank={setRank} />

      {/* office */}
      <ErrorBoundary FallbackComponent={OfficeSelectError}>
        <OfficeSelect
          office={office}
          setOffice={setOffice}
          setCurrentPage={setCurrentPage}
        />
      </ErrorBoundary>

      {/* status */}
      <StatusSelect
        status={status}
        setStatus={setStatus}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};

export default Filters;
