import { Flame, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NoOfficeFoundProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

const NoClassificationFound = ({
  hasFilters = false,
  onClearFilters,
}: NoOfficeFoundProps) => {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center rounded-lg border bg-background px-6 py-10 text-center'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <Flame className='size-6 text-muted-foreground' />
      </div>

      <h3 className='text-base font-semibold'>No Classifications Found</h3>

      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {hasFilters
          ? "No classifications match your current search or filter. Try adjusting your filters."
          : "There are no classifications available to display."}
      </p>

      {hasFilters && onClearFilters && (
        <Button
          variant='outline'
          size='sm'
          className='mt-4'
          onClick={onClearFilters}
        >
          <RotateCcw className='size-4' />
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default NoClassificationFound;
