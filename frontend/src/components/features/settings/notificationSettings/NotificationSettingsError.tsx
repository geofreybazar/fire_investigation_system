import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface NotificationSettingsErrorProps {
  error: unknown;
  resetErrorBoundary?: () => void;
}

const NotificationSettingsError = ({
  resetErrorBoundary,
}: NotificationSettingsErrorProps) => {
  return (
    <Card>
      <CardHeader className='p-4 sm:p-6'>
        <div className='flex items-center gap-3'>
          <div className='src/components/features/settigns/notificationSettingsflex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10'>
            <AlertCircle className='size-4 text-destructive' />
          </div>

          <div className='min-w-0'>
            <h3 className='text-base font-medium'>Notifications</h3>

            <p className='text-sm text-muted-foreground'>
              Unable to load your notification settings.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
        <div className='flex flex-col items-start justify-between gap-4 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center'>
          <div className='min-w-0'>
            <p className='text-sm font-medium'>Something went wrong</p>

            <p className='mt-1 text-sm text-muted-foreground'>
              We couldn't retrieve your notification preferences. Please try
              again.
            </p>
          </div>

          {resetErrorBoundary && (
            <Button
              variant='outline'
              size='sm'
              onClick={resetErrorBoundary}
              className='shrink-0'
            >
              <RefreshCw className='size-4' />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsError;
