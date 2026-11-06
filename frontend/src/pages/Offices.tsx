import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";

import Header from "@/components/features/offices/Header";
import Filters from "@/components/features/offices/Filters";
import loadable from "@loadable/component";
import TableLoading from "@/components/features/offices/table/TableLoading";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";

const OfficeTable = loadable(
  () => import("@/components/features/offices/table/OfficeTable"),
  {
    fallback: <TableLoading />,
  },
);

const Offices = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [officeType, setOfficeType] = useState({
    value: "",
    label: "All types",
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  return (
    <div className='w-full space-y-6'>
      {/* Header */}
      <Header />

      {/* Filters */}
      <Filters
        search={search}
        setSearch={setSearch}
        officeType={officeType}
        setOfficeType={setOfficeType}
        setCurrentPage={setCurrentPage}
      />

      {/* Table */}
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <OfficeTable
          debouncedSearch={debouncedSearch}
          officeType={officeType.value}
          setSearch={setSearch}
          setOfficeType={setOfficeType}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Offices;
