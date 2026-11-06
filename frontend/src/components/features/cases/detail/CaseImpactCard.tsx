import { IMPACT_FIELDS, type CaseDetail } from "@/interface/case/case";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Casualties and damage. Edited with the rest of the case details.
const CaseImpactCard = ({
  investigationCase,
}: {
  investigationCase: CaseDetail;
}) => {
  const { impact } = investigationCase;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Impact</CardTitle>
      </CardHeader>
      <CardContent>
        {impact ? (
          <dl className='grid gap-2 sm:grid-cols-2'>
            {IMPACT_FIELDS.map(([key, label]) => (
              <div key={key} className='flex justify-between gap-2 text-sm'>
                <dt className='text-muted-foreground'>{label}</dt>
                <dd>{impact[key] ?? "—"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className='text-sm text-muted-foreground'>Not recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CaseImpactCard;
