import type { CaseState } from "@/constants/investigation";
import type {
  CategoryType,
  StatisticsFilters,
} from "@/interface/statistics/statistics";

export const ALL = "ALL";

// The filter values as the inputs hold them; dates are calendar days.
export interface FilterState {
  from: string;
  to: string;
  state: string;
  categoryType: string;
}

// Today in Philippine time, as YYYY-MM-DD for date inputs.
const manilaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(
    new Date(),
  );

export const yearToDate = (): FilterState => ({
  from: `${manilaToday().slice(0, 4)}-01-01`,
  to: manilaToday(),
  state: ALL,
  categoryType: ALL,
});

// Calendar days cover the whole day in Philippine time.
export const toStatisticsFilters = (state: FilterState): StatisticsFilters => ({
  from: state.from ? `${state.from}T00:00:00.000+08:00` : undefined,
  to: state.to ? `${state.to}T23:59:59.999+08:00` : undefined,
  state: state.state === ALL ? undefined : (state.state as CaseState),
  categoryType:
    state.categoryType === ALL
      ? undefined
      : (state.categoryType as CategoryType),
});
