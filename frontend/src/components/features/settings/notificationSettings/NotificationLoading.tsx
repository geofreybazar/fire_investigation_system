import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const NotificationLoading = () => {
  return (
    <Card>
      <CardHeader className='p-4 sm:p-6'>
        <div className='flex items-center gap-3'>
          {/* Icon */}
          <Skeleton className='size-9 shrink-0 rounded-md' />

          {/* Title + description */}
          <div className='min-w-0 flex-1 space-y-2'>
            <Skeleton className='h-4 w-32 max-w-full' />
            <Skeleton className='h-3 w-full max-w-xs sm:max-w-md' />
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-5 p-4 sm:p-6'>
        {/* Investigation Updates */}
        <div className='flex items-center justify-between gap-4'>
          <div className='min-w-0 flex-1 space-y-2'>
            <Skeleton className='h-4 w-40 max-w-full' />
            <Skeleton className='h-3 w-full max-w-md' />
          </div>

          <Skeleton className='h-5 w-9 shrink-0 rounded-full' />
        </div>

        <Separator />

        {/* Report Review */}
        <div className='flex items-center justify-between gap-4'>
          <div className='min-w-0 flex-1 space-y-2'>
            <Skeleton className='h-4 w-28 max-w-full' />
            <Skeleton className='h-3 w-full max-w-md' />
          </div>

          <Skeleton className='h-5 w-9 shrink-0 rounded-full' />
        </div>

        <Separator />

        {/* System Announcements */}
        <div className='flex items-center justify-between gap-4'>
          <div className='min-w-0 flex-1 space-y-2'>
            <Skeleton className='h-4 w-36 max-w-full' />
            <Skeleton className='h-3 w-full max-w-md' />
          </div>

          <Skeleton className='h-5 w-9 shrink-0 rounded-full' />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationLoading;
