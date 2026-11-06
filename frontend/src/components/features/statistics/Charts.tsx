import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "@/interface/statistics/statistics";

// Recharts styled with the theme tokens, so both themes read well.
const AXIS = {
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
  stroke: "var(--border)",
};

const tooltipProps = {
  cursor: { fill: "var(--muted)", opacity: 0.6 },
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--popover-foreground)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--popover-foreground)" },
} as const;

interface BarProps {
  data: Bucket[];
  // A colour per bar; the brand colour otherwise.
  colorOf?: (bucket: Bucket) => string;
}

// Vertical bars, for short labels in a natural order (months).
export const ColumnChart = ({ data, colorOf }: BarProps) => (
  <ResponsiveContainer width='100%' height={260}>
    <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid vertical={false} stroke='var(--border)' />
      <XAxis
        dataKey='label'
        {...AXIS}
        interval={0}
        angle={data.length > 6 ? -30 : 0}
        textAnchor={data.length > 6 ? "end" : "middle"}
        height={data.length > 6 ? 60 : 30}
      />
      <YAxis allowDecimals={false} {...AXIS} />
      <Tooltip {...tooltipProps} />
      <Bar
        dataKey='count'
        name='Cases'
        radius={[4, 4, 0, 0]}
        fill='var(--primary)'
      >
        {colorOf &&
          data.map((bucket) => (
            <Cell key={bucket.key} fill={colorOf(bucket)} />
          ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

// Horizontal bars, for long labels such as offices and causes.
export const RankingChart = ({ data, colorOf }: BarProps) => (
  <ResponsiveContainer width='100%' height={Math.max(160, data.length * 34)}>
    <BarChart
      data={data}
      layout='vertical'
      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
    >
      <CartesianGrid horizontal={false} stroke='var(--border)' />
      <XAxis type='number' allowDecimals={false} {...AXIS} />
      <YAxis
        type='category'
        dataKey='label'
        width={170}
        {...AXIS}
        tickFormatter={(label: string) =>
          label.length > 26 ? `${label.slice(0, 25)}…` : label
        }
      />
      <Tooltip {...tooltipProps} />
      <Bar
        dataKey='count'
        name='Cases'
        radius={[0, 4, 4, 0]}
        fill='var(--primary)'
      >
        {colorOf &&
          data.map((bucket) => (
            <Cell key={bucket.key} fill={colorOf(bucket)} />
          ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);
