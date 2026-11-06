import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bucket } from "@/interface/statistics/statistics";

interface ChartCardProps {
  title: string;
  description?: string;
  buckets: Bucket[];
  children: React.ReactNode;
}

// A chart with its numbers also as a table for screen readers, and an empty
// message instead of a blank chart.
const ChartCard = ({
  title,
  description,
  buckets,
  children,
}: ChartCardProps) => {
  const empty = buckets.every((bucket) => bucket.count === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>{title}</CardTitle>
        {description && (
          <p className='text-sm text-muted-foreground'>{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
            No cases for these filters.
          </p>
        ) : (
          <>
            <div aria-hidden>{children}</div>
            <table className='sr-only'>
              <caption>{title}</caption>
              <tbody>
                {buckets.map((bucket) => (
                  <tr key={bucket.key}>
                    <th scope='row'>{bucket.label}</th>
                    <td>{bucket.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
