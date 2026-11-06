import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";

import Header from "@/components/features/incidentClassification/Header";
import Filters from "@/components/features/incidentClassification/Filters";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import loadable from "@loadable/component";

import TableLoading from "@/components/features/offices/table/TableLoading";

const ClassificationTable = loadable(
  () =>
    import("@/components/features/incidentClassification/table/ClassificationTable"),
  {
    fallback: <TableLoading />,
  },
);

const IncidentClassification = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Header />

      {/* Filters */}
      <Filters
        search={search}
        setSearch={setSearch}
        setCurrentPage={setCurrentPage}
      />

      {/* table */}
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <ClassificationTable
          debouncedSearch={debouncedSearch}
          setSearch={setSearch}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </ErrorBoundary>
    </div>
  );
};

export default IncidentClassification;
