import useGetUsers from "@/hooks/users/useGetUsers";

import PaginationComponent from "@/components/common/PaginationComponent";
import DesktopView from "./DesktopView/DesktopView";
import NoPersonnelFound from "./NoPersonnelFound";
import MobileView from "./MobileView/MobileView";

import type { Rank } from "@/constants/personnel";

interface PersonnelTableProps {
  debouncedSearch: string;
  setSearch: (value: string) => void;
  office: string;
  setOffice: (office: { id: string; label: string }) => void;
  rank: Rank | undefined;
  setRank: (rank: Rank | undefined) => void;
  status: "Active" | "Inactive";
  setStatus: (s: "Active" | "Inactive") => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const PersonnelTable = ({
  debouncedSearch,
  setSearch,
  office,
  setOffice,
  rank,
  setRank,
  status,
  setStatus,
  currentPage,
  setCurrentPage,
}: PersonnelTableProps) => {
  const { users } = useGetUsers(
    currentPage,
    debouncedSearch,
    office,
    rank,
    status,
  );

  const clearFilters = () => {
    setSearch("");
    setOffice({
      id: "",
      label: "All offices",
    });
    setRank(undefined);
    setStatus("Active");
    setCurrentPage(1);
  };

  if (!users || users.data.length === 0) {
    return (
      <NoPersonnelFound
        hasFilters={Boolean(debouncedSearch || office || rank)}
        onClearFilters={clearFilters}
      />
    );
  }

  return (
    <div className='rounded-lg border flex flex-col'>
      {/* Desktop Table */}
      <div className='hidden md:block'>
        <DesktopView users={users.data} />
      </div>
      {/* Mobile Cards */}
      <div className='space-y-3 md:hidden'>
        <MobileView users={users.data} />
      </div>
      <div className='self-end'>
        <PaginationComponent
          totalPages={users.pagination.totalPages}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
};

export default PersonnelTable;
