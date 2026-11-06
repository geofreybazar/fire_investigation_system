import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  // A lucide icon element.
  icon: React.ReactNode;
  title: string;
  description: string;
  // With filters applied, shows a "Clear Filters" button.
  onClearFilters?: () => void;
  // Optional extra content, e.g. a list of what is coming.
  children?: React.ReactNode;
}

const EmptyState = ({
  icon,
  title,
  description,
  onClearFilters,
  children,
}: EmptyStateProps) => {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center rounded-lg border bg-background px-6 py-10 text-center'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6'>
        {icon}
      </div>

      <h3 className='text-base font-semibold'>{title}</h3>

      <p className='mt-1 max-w-md text-sm text-muted-foreground'>
        {description}
      </p>

      {children}

      {onClearFilters && (
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

export default EmptyState;
