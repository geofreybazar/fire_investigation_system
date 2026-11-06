import useGetOffices from "@/hooks/offices/useGetOffices";

import PaginationComponent from "@/components/common/PaginationComponent";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import NoOfficeFound from "./NoOfficeFound";

interface OfficeTableProps {
  debouncedSearch: string;
  officeType: string;
  setSearch: (value: string) => void;
  setOfficeType: (officeType: { value: string; label: string }) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const OfficeTable = ({
  debouncedSearch,
  officeType,
  setSearch,
  setOfficeType,
  currentPage,
  setCurrentPage,
}: OfficeTableProps) => {
  const { offices } = useGetOffices(currentPage, debouncedSearch, officeType);

  const clearFilters = () => {
    setSearch("");
    setOfficeType({
      value: "",
      label: "",
    });
    setCurrentPage(1);
  };

  if (!offices || offices.data.length === 0) {
    return (
      <NoOfficeFound
        hasFilters={Boolean(debouncedSearch || officeType)}
        onClearFilters={clearFilters}
      />
    );
  }

  return (
    <div className='rounded-lg border flex flex-col'>
      {/* Desktop Table */}
      <div className='hidden md:block'>
        <DesktopView offices={offices.data} />
      </div>

      {/* Mobile Cards */}
      <div className='space-y-3 md:hidden'>
        <MobileView offices={offices.data} />
      </div>

      <div className='self-end'>
        <PaginationComponent
          totalPages={offices.pagination.totalPages}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
};

export default OfficeTable;
