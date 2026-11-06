import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

const KpiCard = ({ label, value, hint }: KpiCardProps) => (
  <Card>
    <CardContent className='space-y-1 p-4'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='text-2xl font-semibold tabular-nums'>{value}</p>
      {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </CardContent>
  </Card>
);

export default KpiCard;
