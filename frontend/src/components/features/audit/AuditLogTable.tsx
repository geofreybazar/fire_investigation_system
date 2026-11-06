import useGetAuditLogs from "@/hooks/audit/useGetAuditLogs";
import type { AuditLog, AuditLogFilters } from "@/interface/audit/audit";
import { formatDateTime } from "@/utils/dateTime";
import { formatEnum } from "@/utils/formatEnum";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/common/PaginationComponent";

interface AuditLogTableProps {
  filters: AuditLogFilters;
  setCurrentPage: (page: number) => void;
  onClearFilters: () => void;
}

const display = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);

// Updates show "field: from → to"; creates and deletes show the snapshot.
const Changes = ({ changes }: { changes: AuditLog["changes"] }) => {
  if (!changes || Object.keys(changes).length === 0) {
    return <span className='text-muted-foreground'>—</span>;
  }

  return (
    <ul className='space-y-0.5'>
      {Object.entries(changes).map(([field, value]) => (
        <li key={field} className='break-all'>
          <span className='text-muted-foreground'>{formatEnum(field)}:</span>{" "}
          {value !== null && typeof value === "object" && "from" in value
            ? `${display(value.from)} → ${display(value.to)}`
            : display(value)}
        </li>
      ))}
    </ul>
  );
};

const AuditLogTable = ({
  filters,
  setCurrentPage,
  onClearFilters,
}: AuditLogTableProps) => {
  const { auditLogs } = useGetAuditLogs(filters);

  if (auditLogs.data.length === 0) {
    const hasFilters = Boolean(
      filters.action || filters.entityType || filters.from || filters.to,
    );

    return (
      <div className='flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border text-sm text-muted-foreground'>
        No audit entries found.
        {hasFilters && (
          <Button variant='outline' size='sm' onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='flex flex-col overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Record</TableHead>
            <TableHead>Changes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditLogs.data.map((entry) => (
            <TableRow key={entry.id} className='align-top'>
              <TableCell className='whitespace-nowrap'>
                {formatDateTime(entry.createdAt)}
              </TableCell>
              <TableCell>
                <p>
                  {entry.actor.first_name} {entry.actor.last_name}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {entry.actor.account_number} · {formatEnum(entry.actor.role)}
                </p>
              </TableCell>
              <TableCell className='whitespace-nowrap'>
                {formatEnum(entry.action)}
              </TableCell>
              <TableCell>
                <p>{formatEnum(entry.entityType)}</p>
                <p className='font-mono text-xs text-muted-foreground'>
                  {entry.entityId}
                </p>
              </TableCell>
              <TableCell className='max-w-sm text-sm'>
                <Changes changes={entry.changes} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className='self-end'>
        <PaginationComponent
          totalPages={auditLogs.pagination.totalPages}
          currentPage={filters.page}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default AuditLogTable;
