import type { CaseDetail } from "@/interface/case/case";
import { personName } from "@/utils/formatEnum";
import { formatDateTime } from "@/utils/dateTime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caseState } from "@/utils/statusTone";
import { CaseStateBadge } from "../StatusBadges";

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='space-y-0.5'>
    <p className='text-xs text-muted-foreground'>{label}</p>
    <div className='text-sm'>{value ?? "—"}</div>
  </div>
);

const CaseSummary = ({
  investigationCase,
}: {
  investigationCase: CaseDetail;
}) => {
  const { location } = investigationCase;

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Case</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 sm:grid-cols-2'>
          <Item
            label='State'
            value={
              <CaseStateBadge
                state={caseState(investigationCase.investigations)}
              />
            }
          />
          <Item
            label='Handled by'
            value={investigationCase.handlingOffice.name}
          />
          <Item
            label='Category'
            value={
              investigationCase.subcategory
                ? `${investigationCase.category.name} — ${investigationCase.subcategory.name}`
                : investigationCase.category.name
            }
          />
          <Item
            label='Opened by'
            value={`${personName(investigationCase.createdBy)}, ${investigationCase.createdByOffice.name}`}
          />
          <Item
            label='Fire incident'
            value={formatDateTime(investigationCase.dateTimeFireIncident)}
          />
          <Item
            label='Call received'
            value={formatDateTime(investigationCase.dateTimeCallReceived)}
          />
          <Item
            label='Reported'
            value={formatDateTime(investigationCase.dateTimeReported)}
          />
          <Item
            label='Opened'
            value={formatDateTime(investigationCase.createdAt)}
          />
          {investigationCase.remarks && (
            <div className='sm:col-span-2'>
              <Item label='Remarks' value={investigationCase.remarks} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Location</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 sm:grid-cols-2'>
          <div className='sm:col-span-2'>
            <Item
              label='Place of occurrence'
              value={location?.placeOfOccurence}
            />
          </div>
          <Item label='Barangay' value={location?.barangay} />
          <Item label='Station' value={investigationCase.station.name} />
          <Item
            label='City / municipality'
            value={location?.city_municipality}
          />
          <Item
            label='Province / district'
            value={location?.province_district}
          />
          <Item label='Region' value={location?.region} />
          <Item
            label='Coordinates'
            value={
              location?.latitude && location.longitude
                ? `${location.latitude}, ${location.longitude}`
                : "Not set"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CaseSummary;
