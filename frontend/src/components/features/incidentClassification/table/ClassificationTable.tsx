import PaginationComponent from "@/components/common/PaginationComponent";
import useGetClassifications from "@/hooks/incidentClassification/useGetClassifications";
import DesktopView from "./DesktopView";
import NoClassificationFound from "./NoClassificationFound";
import MobileView from "./MobileView";

interface ClassificationTableProps {
  debouncedSearch: string;
  setSearch: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const ClassificationTable = ({
  debouncedSearch,
  setSearch,
  currentPage,
  setCurrentPage,
}: ClassificationTableProps) => {
  const { fireIncidentClassifications } = useGetClassifications(
    currentPage,
    debouncedSearch,
  );

  const clearFilters = () => {
    setSearch("");
    setCurrentPage(1);
  };

  if (
    !fireIncidentClassifications ||
    fireIncidentClassifications.data.length === 0
  ) {
    return (
      <NoClassificationFound
        hasFilters={Boolean(debouncedSearch)}
        onClearFilters={clearFilters}
      />
    );
  }

  return (
    <div className='rounded-lg border flex flex-col'>
      {/* Desktop Table */}
      <div className='hidden overflow-hidden rounded-lg border md:block'>
        <DesktopView
          fireIncidentClassifications={fireIncidentClassifications.data}
        />
      </div>

      {/* Mobile Cards */}
      <div className='space-y-3 md:hidden'>
        <MobileView
          fireIncidentClassifications={fireIncidentClassifications.data}
        />
      </div>

      <div className='self-end'>
        <PaginationComponent
          totalPages={fireIncidentClassifications.pagination.totalPages}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
};

export default ClassificationTable;
