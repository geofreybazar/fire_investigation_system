import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PositionsTableLoading = () => {
  return (
    <div className='flex flex-col overflow-hidden rounded-lg border'>
      {/* Desktop */}
      <div className='hidden md:block'>
        <Table className='table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40%]'>Position</TableHead>

              <TableHead className='w-[20%]'>Personnel</TableHead>

              <TableHead className='w-[25%]'>Status</TableHead>

              <TableHead className='w-[15%] text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {/* Position */}
                <TableCell>
                  <Skeleton className='h-4 w-40' />
                </TableCell>

                {/* Personnel */}
                <TableCell>
                  <Skeleton className='h-4 w-20' />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Skeleton className='h-6 w-16 rounded-full' />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className='flex justify-end'>
                    <Skeleton className='size-8 rounded-md' />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className='divide-y md:hidden'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className='space-y-4 p-4'>
            {/* Header */}
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 flex-1 space-y-2'>
                <Skeleton className='h-4 w-36 max-w-full' />
                <Skeleton className='h-3 w-24' />
              </div>

              <Skeleton className='size-8 shrink-0 rounded-md' />
            </div>

            {/* Status */}
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-6 w-16 rounded-full' />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className='flex justify-end border-t p-4'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-8 rounded-md' />
          <Skeleton className='h-8 w-8 rounded-md' />
          <Skeleton className='h-8 w-8 rounded-md' />
        </div>
      </div>
    </div>
  );
};

export default PositionsTableLoading;
