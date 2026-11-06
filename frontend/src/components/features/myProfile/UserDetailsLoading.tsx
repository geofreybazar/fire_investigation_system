import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const UserDetailsLoading = () => {
  return (
    <div className='space-y-6'>
      {/* Profile Header */}
      <Card>
        <CardContent className='space-y-5 p-4 sm:p-5'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            {/* Avatar */}
            <Skeleton className='size-16 shrink-0 rounded-full' />

            {/* User Information */}
            <div className='min-w-0 flex-1 space-y-2'>
              <Skeleton className='h-6 w-48 max-w-full' />
              <Skeleton className='h-4 w-56 max-w-full' />
              <Skeleton className='mt-2 h-5 w-24 rounded-full' />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-64 max-w-full' />
          </CardHeader>

          <CardContent className='space-y-5'>
            <ProfileItemSkeleton />
            <ProfileItemSkeleton />
            <ProfileItemSkeleton />
            <ProfileItemSkeleton />
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-72 max-w-full' />
          </CardHeader>

          <CardContent className='space-y-5'>
            <ProfileItemSkeleton />
            <ProfileItemSkeleton />
            <ProfileItemSkeleton />
            <ProfileItemSkeleton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProfileItemSkeleton = () => {
  return (
    <div className='flex items-start gap-3'>
      {/* Icon */}
      <Skeleton className='mt-0.5 size-8 shrink-0 rounded-md' />

      {/* Label + Value */}
      <div className='min-w-0 flex-1 space-y-2'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='h-4 w-40 max-w-full' />
      </div>
    </div>
  );
};

export default UserDetailsLoading;
