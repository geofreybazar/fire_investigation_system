import { Suspense } from "react";
import { Link } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { FolderSearch, Inbox } from "lucide-react";
import { useGetStatisticsSummary } from "@/hooks/statistics/useStatistics";
import useGetInvestigationQueue from "@/hooks/investigations/useGetInvestigationQueue";
import useGetAssignedInvestigations from "@/hooks/investigations/useGetAssignedInvestigations";
import { toStatisticsFilters, yearToDate } from "@/utils/statisticsFilters";
import KpiCard from "@/components/features/statistics/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatPeso } from "@/utils/formatNumber";

// Each part loads on its own; a failure hides that part, not the dashboard.
const Section = ({
  children,
  height,
}: {
  children: React.ReactNode;
  height: string;
}) => (
  <ErrorBoundary fallback={null}>
    <Suspense fallback={<Skeleton className={`w-full ${height}`} />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const YearKpis = () => {
  const { summary } = useGetStatisticsSummary(
    toStatisticsFilters(yearToDate()),
  );
  const { totals, impact } = summary;

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <KpiCard label='Cases this year' value={formatCount(totals.cases)} />
      <KpiCard
        label='Open investigations'
        value={formatCount(totals.open)}
      />
      <KpiCard
        label='Deaths this year'
        value={formatCount(
          impact.fatalitiesCiv + impact.fatalitiesBFP + impact.fatalitiesLEA,
        )}
      />
      <KpiCard
        label='Estimated damages this year'
        value={formatPeso(impact.estimatedDamages)}
      />
    </div>
  );
};

export const YearSummary = () => (
  <Section height='h-24'>
    <YearKpis />
  </Section>
);

interface TaskProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  count: number;
}

const Task = ({ to, icon, label, count }: TaskProps) => (
  <Link
    to={to}
    className='flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring'
  >
    <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5'>
      {icon}
    </div>
    <div className='min-w-0 flex-1'>
      <p className='text-2xl font-semibold tabular-nums'>
        {formatCount(count)}
      </p>
      <p className='text-sm text-muted-foreground'>{label}</p>
    </div>
  </Link>
);

const CaseQueue = () => {
  const { queue } = useGetInvestigationQueue(1);

  return (
    <Task
      to='/investigations'
      icon={<FolderSearch />}
      label='Cases waiting on your office'
      count={queue.pagination.total}
    />
  );
};

const AssignedInvestigations = () => {
  const { assigned } = useGetAssignedInvestigations(1);

  return (
    <Task
      to='/investigations'
      icon={<Inbox />}
      label='Investigations assigned to you'
      count={assigned.pagination.total}
    />
  );
};

export const MyTasks = ({
  queue,
  assigned,
}: {
  queue: boolean;
  assigned: boolean;
}) => {
  if (!queue && !assigned) {
    return null;
  }

  return (
    <section className='space-y-3'>
      <h2 className='text-sm font-medium text-muted-foreground'>My tasks</h2>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {queue && (
          <Section height='h-20'>
            <CaseQueue />
          </Section>
        )}
        {assigned && (
          <Section height='h-20'>
            <AssignedInvestigations />
          </Section>
        )}
      </div>
    </section>
  );
};
