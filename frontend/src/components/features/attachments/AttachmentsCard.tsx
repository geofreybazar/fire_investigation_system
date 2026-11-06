import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import type { AttachmentTarget } from "@/interface/attachment/attachment";
import AttachmentList from "./AttachmentList";
import AttachmentUploader from "./AttachmentUploader";

interface AttachmentsCardProps {
  title: string;
  description: string;
  target: AttachmentTarget;
  // The backend enforces both; these only decide which controls show.
  canUpload: boolean;
  allowRemoval: boolean;
}

const AttachmentsCard = ({
  title,
  description,
  target,
  canUpload,
  allowRemoval,
}: AttachmentsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className='text-base'>{title}</CardTitle>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </CardHeader>
    <CardContent className='space-y-4'>
      {canUpload && <AttachmentUploader target={target} />}
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<Skeleton className='h-16 w-full' />}>
          <AttachmentList target={target} allowRemoval={allowRemoval} />
        </Suspense>
      </ErrorBoundary>
    </CardContent>
  </Card>
);

export default AttachmentsCard;
