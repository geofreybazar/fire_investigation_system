import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";

import { type Rank } from "@/constants/personnel";

import Filters from "@/components/features/personnel/table/Filters/Filters";
import Header from "@/components/features/personnel/Header";
import loadable from "@loadable/component";
import PersonnelLoading from "@/components/features/personnel/table/PersonnelLoading";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";

const PersonnelTable = loadable(
  () => import("@/components/features/personnel/table/PersonnelTable"),
  {
    fallback: <PersonnelLoading />,
  },
);

const Personnel = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [office, setOffice] = useState({
    id: "",
    label: "All offices",
  });

  const [rank, setRank] = useState<Rank | undefined>();
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  return (
    <div className='w-full space-y-6'>
      <Header />

      <Filters
        search={search}
        setSearch={setSearch}
        office={office}
        setOffice={setOffice}
        rank={rank}
        setRank={setRank}
        status={status}
        setStatus={setStatus}
        setCurrentPage={setCurrentPage}
      />

      {/* table */}
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <PersonnelTable
          debouncedSearch={debouncedSearch}
          setSearch={setSearch}
          office={office.id}
          setOffice={setOffice}
          rank={rank}
          setRank={setRank}
          status={status}
          setStatus={setStatus}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Personnel;
