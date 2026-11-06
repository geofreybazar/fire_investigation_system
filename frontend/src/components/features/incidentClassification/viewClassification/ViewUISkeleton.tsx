import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ViewUISkeleton = () => {
  return (
    <div className='space-y-6'>
      {/* Classification Information */}
      <div className='flex items-start gap-4'>
        <div className='min-w-0 flex-1 space-y-2'>
          {/* Classification name */}
          <Skeleton className='h-7 w-48' />

          {/* Classification label */}
          <Skeleton className='h-4 w-40' />
        </div>

        {/* Type badge */}
        <Skeleton className='h-6 w-24 rounded-full' />
      </div>

      <Separator />

      {/* Subcategories */}
      <div className='space-y-4'>
        {/* Subcategory header */}
        <div className='flex items-center justify-between gap-3'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-64' />
          </div>

          {/* Add Subcategory button */}
          <Skeleton className='h-9 w-36' />
        </div>

        {/* Subcategory cards */}
        <div className='space-y-3'>
          <Skeleton className='h-20 w-full rounded-lg' />
          <Skeleton className='h-20 w-full rounded-lg' />
          <Skeleton className='h-20 w-full rounded-lg' />
        </div>
      </div>
    </div>
  );
};

export default ViewUISkeleton;
