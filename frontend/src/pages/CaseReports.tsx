import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Download, FileText } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDownloadCaseReport } from "@/hooks/statistics/useStatistics";
import StatisticsFilterBar from "@/components/features/statistics/StatisticsFilterBar";
import {
  toStatisticsFilters,
  yearToDate,
  type FilterState,
} from "@/utils/statisticsFilters";
import CaseReportTable from "@/components/features/statistics/CaseReportTable";

const CaseReports = () => {
  const [filters, setFilters] = useState(yearToDate);
  const [page, setPage] = useState(1);
  const { download, isPending } = useDownloadCaseReport();

  const apiFilters = toStatisticsFilters(filters);

  return (
    <div className='space-y-6'>
      <PageHeader
        icon={<FileText />}
        title='Case Reports'
        description='Investigation cases in your office and the offices below it.'
      >
        <Button
          onClick={() => download(apiFilters).catch(() => {})}
          disabled={isPending}
        >
          {isPending ? <Spinner /> : <Download className='size-4' />}
          Download CSV
        </Button>
      </PageHeader>

      <StatisticsFilterBar
        value={filters}
        onChange={(next: FilterState) => {
          setFilters(next);
          setPage(1);
        }}
      />

      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<TableSkeleton />}>
          <CaseReportTable
            filters={apiFilters}
            page={page}
            setPage={setPage}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default CaseReports;
