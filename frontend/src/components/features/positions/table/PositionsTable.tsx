import useGetPositions from "@/hooks/position/useGetPositions";
import PaginationComponent from "@/components/common/PaginationComponent";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import { BriefcaseBusiness } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

interface PositionsTableProps {
  debouncedSearch: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  setSearch: (value: string) => void;
}

const PositionsTable = ({
  debouncedSearch,
  currentPage,
  setCurrentPage,
  setSearch,
}: PositionsTableProps) => {
  const { positions } = useGetPositions(currentPage, debouncedSearch);

  const clearFilters = () => {
    setSearch("");
    setCurrentPage(1);
  };

  if (!positions || positions.data.length === 0) {
    return (
      <EmptyState
        icon={<BriefcaseBusiness />}
        title='No Positions Found'
        description={
          debouncedSearch
            ? "No positions match your search. Try a different name."
            : "There are no positions yet. Add one to start assigning personnel."
        }
        onClearFilters={debouncedSearch ? clearFilters : undefined}
      />
    );
  }

  return (
    <div className='rounded-lg border flex flex-col'>
      {/* DesktopView */}
      <div className='hidden md:block'>
        <DesktopView positions={positions.data} />
      </div>

      {/* MobileView */}
      <div className='divide-y md:hidden'>
        <MobileView positions={positions.data} />
      </div>

      <div className='self-end'>
        <PaginationComponent
          totalPages={positions.pagination.totalPages}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
};

export default PositionsTable;
