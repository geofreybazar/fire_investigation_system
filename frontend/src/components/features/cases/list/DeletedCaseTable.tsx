import { useState } from "react";
import { ArchiveRestore } from "lucide-react";
import useGetDeletedCases from "@/hooks/cases/useGetDeletedCases";
import useRestoreCase from "@/hooks/cases/useRestoreCase";
import { formatDateTime } from "@/utils/dateTime";
import { personName } from "@/utils/formatEnum";
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
import AlertDialogComponent from "@/components/common/AlertDialogComponent";
import type { DeletedCase } from "@/interface/case/case";

// SUPER_ADMIN only: cases that were deleted (hidden), with restore.
const DeletedCaseTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<DeletedCase>();
  const { deletedCases } = useGetDeletedCases(currentPage);
  const { restoreCase } = useRestoreCase();

  if (deletedCases.data.length === 0) {
    return (
      <div className='flex min-h-[200px] items-center justify-center rounded-lg border text-sm text-muted-foreground'>
        No deleted cases.
      </div>
    );
  }

  return (
    <div className='flex flex-col overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case No.</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Memo</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className='w-12' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedCases.data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className='font-medium'>
                {item.caseNo}
              </TableCell>
              <TableCell>{item.station.name}</TableCell>
              <TableCell>{formatDateTime(item.deletedAt)}</TableCell>
              <TableCell>{personName(item.deletedBy)}</TableCell>
              <TableCell>{item.deletionMemoReference ?? "—"}</TableCell>
              <TableCell className='max-w-xs truncate text-muted-foreground'>
                {item.deletionReason ?? "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelected(item)}
                >
                  <ArchiveRestore className='size-4' />
                  Restore
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className='self-end'>
        <PaginationComponent
          totalPages={deletedCases.pagination.totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <AlertDialogComponent
        open={!!selected}
        setOpen={(open) => !open && setSelected(undefined)}
        title='Restore case?'
        description='The case and all its investigations will be visible again with the same number.'
        action={{
          label: "Restore",
          onClick: () => {
            if (selected) restoreCase(selected.id).catch(() => {});
            setSelected(undefined);
          },
        }}
      />
    </div>
  );
};

export default DeletedCaseTable;
