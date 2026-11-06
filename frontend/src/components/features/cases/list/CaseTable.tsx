import { useNavigate } from "react-router";
import { FolderSearch, RotateCcw } from "lucide-react";
import useGetCases from "@/hooks/cases/useGetCases";
import type { CaseListFilters } from "@/interface/case/case";
import { formatDateTime } from "@/utils/dateTime";
import { rowLinkProps } from "@/utils/rowLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/common/PaginationComponent";
import { caseState } from "@/utils/statusTone";
import { CaseStateBadge, ReportStatusBadge } from "../StatusBadges";

interface CaseTableProps {
  filters: CaseListFilters;
  setCurrentPage: (page: number) => void;
  onClearFilters: () => void;
}

const CaseTable = ({
  filters,
  setCurrentPage,
  onClearFilters,
}: CaseTableProps) => {
  const navigate = useNavigate();
  const { cases } = useGetCases(filters);
  const hasFilters = Boolean(
    filters.search ||
    filters.state ||
    filters.categoryId ||
    filters.from ||
    filters.to,
  );

  if (cases.data.length === 0) {
    return (
      <div className='flex min-h-[280px] flex-col items-center justify-center rounded-lg border px-6 py-10 text-center'>
        <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
          <FolderSearch className='size-6 text-muted-foreground' />
        </div>
        <h3 className='text-base font-semibold'>No Cases Found</h3>
        <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
          {hasFilters
            ? "No cases match your filters."
            : "There are no investigation cases you can view yet."}
        </p>
        {hasFilters && (
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={onClearFilters}
          >
            <RotateCcw className='size-4' />
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  const open = (id: string) => navigate(`/cases/${id}`);

  return (
    <div className='flex flex-col rounded-lg border'>
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case No.</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Handled by</TableHead>
              <TableHead>Fire date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.data.map((item) => {
              const [latest] = item.investigations;
              return (
                <TableRow
                  key={item.id}
                  className='cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'
                  {...rowLinkProps(() => open(item.id))}
                >
                  <TableCell className='font-medium'>{item.caseNo}</TableCell>
                  <TableCell>
                    <div className='flex flex-col items-start gap-1'>
                      <CaseStateBadge state={caseState(item.investigations)} />
                      {latest && (
                        <ReportStatusBadge status={latest.report?.status} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.category.name}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {item.location
                      ? `${item.location.barangay}, ${item.location.city_municipality}`
                      : item.station.name}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {item.handlingOffice.name}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {formatDateTime(item.dateTimeFireIncident ?? item.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className='space-y-3 p-3 md:hidden'>
        {cases.data.map((item) => (
          <Card
            key={item.id}
            className='cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'
            {...rowLinkProps(() => open(item.id))}
          >
            <CardContent className='space-y-2 p-4'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-medium'>{item.caseNo}</span>
                <CaseStateBadge state={caseState(item.investigations)} />
              </div>
              <p className='text-sm'>{item.category.name}</p>
              <p className='text-xs text-muted-foreground'>
                {item.location?.barangay}, {item.station.name}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='self-end'>
        <PaginationComponent
          totalPages={cases.pagination.totalPages}
          currentPage={filters.page}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CaseTable;
