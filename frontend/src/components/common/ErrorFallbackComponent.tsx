import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/interface/error";
import axios from "axios";

// Plain-language titles instead of raw HTTP error names.
const STATUS_TITLES: Record<number, string> = {
  400: "The request couldn't be processed",
  401: "Your session has ended",
  403: "You don't have access to this",
  404: "Not found",
  409: "This was changed by someone else",
  500: "The server ran into a problem",
};

interface OfficeTableErrorProps {
  error: unknown;
  resetErrorBoundary?: () => void;
}

const ErrorFallbackComponent = ({
  error,
  resetErrorBoundary,
}: OfficeTableErrorProps) => {
  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      title = "Can't reach the server";
      message = "Check your connection and try again.";
    } else {
      const status = error.response.status;
      title = STATUS_TITLES[status] ?? "The request failed";
      message =
        error.response.data?.message ?? "Unable to complete the request.";
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className='flex min-h-[280px] w-full items-center justify-center rounded-lg border bg-background px-4 py-8 sm:px-6'>
      <Alert className='w-full max-w-xl'>
        <AlertCircle className='size-5' />

        <AlertTitle>{title}</AlertTitle>

        <AlertDescription className='mt-2'>
          <div className='flex flex-col gap-4'>
            <p>{message}</p>

            <Button
              variant='outline'
              size='sm'
              onClick={resetErrorBoundary}
              className='w-full sm:w-fit'
            >
              <RefreshCw className='mr-2 size-4' />
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorFallbackComponent;
