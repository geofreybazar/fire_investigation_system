import { useGetStatisticsSummary } from "@/hooks/statistics/useStatistics";
import type { StatisticsFilters } from "@/interface/statistics/statistics";
import { formatCount, formatPeso } from "@/utils/formatNumber";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import { ColumnChart, RankingChart } from "./Charts";

const TOP = 10;

const StatisticsContent = ({ filters }: { filters: StatisticsFilters }) => {
  const { summary } = useGetStatisticsSummary(filters);
  const { totals, impact } = summary;

  const deaths =
    impact.fatalitiesCiv + impact.fatalitiesBFP + impact.fatalitiesLEA;
  const injured = impact.injuredCiv + impact.injuredBFP + impact.injuredLEA;

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <KpiCard label='Cases' value={formatCount(totals.cases)} />
        <KpiCard
          label='Open investigations'
          value={formatCount(totals.open)}
          hint='Cases with an investigation in progress'
        />
        <KpiCard
          label='Investigated'
          value={formatCount(totals.investigated)}
          hint='With an approved investigation'
        />
        <KpiCard
          label='No open investigation'
          value={formatCount(totals.cases - totals.open)}
          hint='Completed, or waiting on a decision'
        />
        <KpiCard
          label='Deaths'
          value={formatCount(deaths)}
          hint={`${formatCount(impact.fatalitiesCiv)} civilian · ${formatCount(impact.fatalitiesBFP)} BFP · ${formatCount(impact.fatalitiesLEA)} LEA`}
        />
        <KpiCard
          label='Injured'
          value={formatCount(injured)}
          hint={`${formatCount(impact.injuredCiv)} civilian · ${formatCount(impact.injuredBFP)} BFP · ${formatCount(impact.injuredLEA)} LEA`}
        />
        <KpiCard
          label='Families affected'
          value={formatCount(impact.familiesAffected)}
          hint={`${formatCount(impact.individualsAffected)} individuals · ${formatCount(impact.establishmentsBurned)} establishments`}
        />
        <KpiCard
          label='Estimated damages'
          value={formatPeso(impact.estimatedDamages)}
          hint={
            impact.finalEstimatedDamages > 0
              ? `${formatPeso(impact.finalEstimatedDamages)} final estimate`
              : undefined
          }
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <ChartCard title='Cases per month' buckets={summary.byMonth}>
          <ColumnChart data={summary.byMonth} />
        </ChartCard>
        <ChartCard
          title='By office'
          description='Grouped by the offices directly below yours.'
          buckets={summary.byOffice}
        >
          <RankingChart data={summary.byOffice.slice(0, TOP)} />
        </ChartCard>
        <ChartCard title='By category type' buckets={summary.byCategoryType}>
          <RankingChart data={summary.byCategoryType} />
        </ChartCard>
        <ChartCard
          title='By category'
          description={`The ${TOP} most frequent.`}
          buckets={summary.byCategory}
        >
          <RankingChart data={summary.byCategory.slice(0, TOP)} />
        </ChartCard>
        <ChartCard
          title='Causes of fire'
          description={`The ${TOP} most frequent, from approved investigations.`}
          buckets={summary.byCause}
        >
          <RankingChart data={summary.byCause.slice(0, TOP)} />
        </ChartCard>
        <ChartCard
          title='Classifications'
          description='From approved investigations.'
          buckets={summary.byClassification}
        >
          <RankingChart data={summary.byClassification} />
        </ChartCard>
      </div>
    </div>
  );
};

export default StatisticsContent;
