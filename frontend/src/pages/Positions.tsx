import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import loadable from "@loadable/component";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import Header from "@/components/features/positions/Header";
import Filters from "@/components/features/positions/Filters";
import PositionsTableLoading from "@/components/features/positions/table/PositionsTableLoading";

const PositionsTable = loadable(
  () => import("@/components/features/positions/table/PositionsTable"),
  { fallback: <PositionsTableLoading /> },
);

const Positions = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  return (
    <div className='w-full space-y-6'>
      {/* Header */}
      <Header />
      {/* Filters */}
      <Filters
        search={search}
        setSearch={setSearch}
        setCurrentPage={setCurrentPage}
      />
      {/* Table */}
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <PositionsTable
          debouncedSearch={debouncedSearch}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setSearch={setSearch}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Positions;
