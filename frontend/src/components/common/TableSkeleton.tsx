import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholder for a table of rows.
const TableSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className='space-y-3 rounded-lg border p-4'>
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className='h-8 w-full' />
    ))}
  </div>
);

export default TableSkeleton;
