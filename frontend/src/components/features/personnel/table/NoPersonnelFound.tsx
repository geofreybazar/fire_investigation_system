import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

const NoPersonnelFound = ({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) => {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center rounded-lg border bg-background px-6 py-10 text-center'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <UserRound className='size-6 text-muted-foreground' />
      </div>

      <h3 className='text-base font-semibold'>No Personnel Found</h3>

      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {hasFilters
          ? "No personnel match your current filters."
          : "There are no personnel records available."}
      </p>

      {hasFilters && (
        <Button variant='outline' className='mt-4' onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default NoPersonnelFound;
