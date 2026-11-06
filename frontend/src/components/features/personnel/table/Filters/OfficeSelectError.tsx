import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface OfficeSelectErrorProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

const OfficeSelectError = ({
  error,
  resetErrorBoundary,
}: OfficeSelectErrorProps) => {
  const message =
    error instanceof Error ? error.message : "Unable to load offices.";

  return (
    <div className='flex w-full items-center gap-2 sm:w-48'>
      <div
        className='flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 px-3'
        role='alert'
      >
        <AlertCircle className='size-4 shrink-0 text-destructive' />

        <span className='truncate text-sm text-destructive'>{message}</span>
      </div>

      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-10 shrink-0'
        onClick={resetErrorBoundary}
        aria-label='Retry loading offices'
        title='Retry'
      >
        <RefreshCw className='size-4' />
      </Button>
    </div>
  );
};

export default OfficeSelectError;
