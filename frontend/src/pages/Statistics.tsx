import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import { Skeleton } from "@/components/ui/skeleton";
import StatisticsFilterBar from "@/components/features/statistics/StatisticsFilterBar";
import { toStatisticsFilters, yearToDate } from "@/utils/statisticsFilters";
import StatisticsContent from "@/components/features/statistics/StatisticsContent";

const Loading = () => (
  <div className='space-y-6'>
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className='h-24' />
      ))}
    </div>
    <div className='grid gap-4 lg:grid-cols-2'>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className='h-80' />
      ))}
    </div>
  </div>
);

const Statistics = () => {
  const [filters, setFilters] = useState(yearToDate);

  return (
    <div className='space-y-6'>
      <PageHeader
        icon={<BarChart3 />}
        title='Statistics & Analytics'
        description='Investigation cases in your office and the offices below it.'
      />

      <StatisticsFilterBar
        value={filters}
        onChange={setFilters}
        showState={false}
      />

      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<Loading />}>
          <StatisticsContent filters={toStatisticsFilters(filters)} />
        </Suspense>
      </ErrorBoundary>

      <p className='text-xs text-muted-foreground'>
        Deleted cases are not counted. The date is the date of the fire, or the
        date the case was opened when that is blank. Causes and classifications
        come from each case&apos;s latest approved investigation.
      </p>
    </div>
  );
};

export default Statistics;
