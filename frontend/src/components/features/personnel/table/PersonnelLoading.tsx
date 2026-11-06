import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PersonnelLoading = () => {
  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Personnel</TableHead>
            <TableHead>Rank</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Office</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className='flex items-center gap-3'>
                  <Skeleton className='size-9 rounded-full' />

                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-36' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Skeleton className='h-4 w-12' />
              </TableCell>

              <TableCell>
                <Skeleton className='h-4 w-28' />
              </TableCell>

              <TableCell>
                <Skeleton className='h-4 w-40' />
              </TableCell>

              <TableCell>
                <Skeleton className='h-5 w-16 rounded-full' />
              </TableCell>

              <TableCell>
                <Skeleton className='size-8' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PersonnelLoading;
