import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TableLoading = () => {
  return (
    <div className='rounded-lg border flex flex-col'>
      <div className='hidden md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40%]'>Office</TableHead>
              <TableHead className='w-[20%]'>Type</TableHead>
              <TableHead className='w-[35%]'>Parent Office</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={index}>
                {/* Office */}
                <TableCell className='w-[40%]'>
                  <Skeleton className='h-4 w-40' />
                </TableCell>

                {/* Type */}
                <TableCell className='w-[20%]'>
                  <Skeleton className='h-6 w-28 rounded-full' />
                </TableCell>

                {/* Parent Office */}
                <TableCell className='w-[35%] text-muted-foreground'>
                  <Skeleton className='h-4 w-36' />
                </TableCell>

                {/* Actions */}
                <TableCell className='w-12'>
                  <Skeleton className='h-8 w-8 rounded-md' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='space-y-3 md:hidden'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className='p-4'>
              <div className='flex items-start justify-between gap-3'>
                {/* Office information */}
                <div className='min-w-0 flex-1 space-y-3'>
                  {/* Office name */}
                  <Skeleton className='h-4 w-40 max-w-full' />

                  {/* Office type */}
                  <Skeleton className='h-5 w-28 rounded-full' />

                  {/* Parent office */}
                  <div className='space-y-1.5'>
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-4 w-36 max-w-full' />
                  </div>
                </div>

                {/* Actions */}
                <Skeleton className='size-8 shrink-0 rounded-md' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TableLoading;
