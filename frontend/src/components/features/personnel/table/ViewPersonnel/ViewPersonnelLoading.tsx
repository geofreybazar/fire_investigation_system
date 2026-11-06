import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ViewPersonnelLoading = () => {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Skeleton className='size-12 rounded-full' />

        <div className='space-y-2'>
          <Skeleton className='h-5 w-48' />
          <Skeleton className='h-4 w-32' />
        </div>
      </div>

      <Separator />

      {/* Sections */}
      <div className='space-y-6'>
        <section>
          <Skeleton className='h-5 w-40' />

          <div className='mt-4 grid gap-5 sm:grid-cols-2'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='space-y-2'>
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-4 w-36' />
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <Skeleton className='h-5 w-28' />

          <div className='mt-4 grid gap-5 sm:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className='space-y-2'>
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-4 w-40' />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewPersonnelLoading;
