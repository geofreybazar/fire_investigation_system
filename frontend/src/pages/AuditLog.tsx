import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { History } from "lucide-react";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
} from "@/interface/audit/audit";
import { formatEnum } from "@/utils/formatEnum";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import TableSkeleton from "@/components/common/TableSkeleton";
import AuditLogTable from "@/components/features/audit/AuditLogTable";
import PageHeader from "@/components/common/PageHeader";

const ALL = "ALL";

// Date inputs give a calendar day; the bounds cover that whole day in
// Philippine time.
const startOfDay = (date: string) =>
  date ? `${date}T00:00:00.000+08:00` : undefined;
const endOfDay = (date: string) =>
  date ? `${date}T23:59:59.999+08:00` : undefined;

// What each admin sees is decided by the backend (REQUIREMENTS.md Q-23).
const AuditLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [entityType, setEntityType] = useState<string>(ALL);
  const [action, setAction] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = {
    page: currentPage,
    entityType:
      entityType === ALL ? undefined : (entityType as AuditEntityType),
    action: action === ALL ? undefined : (action as AuditAction),
    from: startOfDay(dateFrom),
    to: endOfDay(dateTo),
  };

  const clearFilters = () => {
    setEntityType(ALL);
    setAction(ALL);
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        icon={<History />}
        title='Audit Log'
        description='Who changed users, offices, positions, classifications and deleted cases, and when.'
      />

      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value ?? ALL);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className='sm:w-56'>
            <SelectValue>
              {entityType === ALL ? "All records" : formatEnum(entityType)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All records</SelectItem>
            {AUDIT_ENTITY_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {formatEnum(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value ?? ALL);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className='sm:w-56'>
            <SelectValue>
              {action === ALL ? "All actions" : formatEnum(action)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {AUDIT_ACTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {formatEnum(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          From
          <Input
            type='date'
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setCurrentPage(1);
            }}
            className='w-auto'
          />
        </label>
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          to
          <Input
            type='date'
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => {
              setDateTo(event.target.value);
              setCurrentPage(1);
            }}
            className='w-auto'
          />
        </label>
      </div>

      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<TableSkeleton />}>
          <AuditLogTable
            filters={filters}
            setCurrentPage={setCurrentPage}
            onClearFilters={clearFilters}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default AuditLog;
