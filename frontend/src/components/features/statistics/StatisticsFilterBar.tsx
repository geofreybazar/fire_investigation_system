import { CASE_STATES, type CaseState } from "@/constants/investigation";
import { CATEGORY_TYPES } from "@/interface/statistics/statistics";
import { ALL, yearToDate, type FilterState } from "@/utils/statisticsFilters";
import { formatEnum } from "@/utils/formatEnum";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatisticsFilterBarProps {
  value: FilterState;
  onChange: (value: FilterState) => void;
  // The report and map filter by state; the summary shows both.
  showState?: boolean;
}

const STATE_LABEL: Record<CaseState, string> = {
  OPEN: "Investigation open",
  CLOSED: "No open investigation",
};

// Shared by Statistics, Case Reports and the Case Map. The date is the fire's
// date, or the date the case was opened when it was left blank.
const StatisticsFilterBar = ({
  value,
  onChange,
  showState = true,
}: StatisticsFilterBarProps) => {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
      <label className='flex items-center gap-2 text-sm text-muted-foreground'>
        From
        <Input
          type='date'
          value={value.from}
          max={value.to || undefined}
          onChange={(event) => set({ from: event.target.value })}
          className='w-auto'
        />
      </label>
      <label className='flex items-center gap-2 text-sm text-muted-foreground'>
        to
        <Input
          type='date'
          value={value.to}
          min={value.from || undefined}
          onChange={(event) => set({ to: event.target.value })}
          className='w-auto'
        />
      </label>

      {showState && (
        <Select
          value={value.state}
          onValueChange={(state) => set({ state: state ?? ALL })}
        >
          <SelectTrigger className='sm:w-56' aria-label='State'>
            <SelectValue>
              {value.state === ALL
                ? "All cases"
                : STATE_LABEL[value.state as CaseState]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cases</SelectItem>
            {CASE_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {STATE_LABEL[state]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={value.categoryType}
        onValueChange={(categoryType) =>
          set({ categoryType: categoryType ?? ALL })
        }
      >
        <SelectTrigger className='sm:w-52' aria-label='Category type'>
          <SelectValue>
            {value.categoryType === ALL
              ? "All category types"
              : formatEnum(value.categoryType)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All category types</SelectItem>
          {CATEGORY_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {formatEnum(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant='ghost' size='sm' onClick={() => onChange(yearToDate())}>
        This year
      </Button>
    </div>
  );
};

export default StatisticsFilterBar;
