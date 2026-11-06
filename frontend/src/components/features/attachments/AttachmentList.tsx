import { useState } from "react";
import { Download, FileText, Image, Trash2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import {
  useDownloadAttachment,
  useGetAttachments,
  useRemoveAttachment,
} from "@/hooks/attachments/useAttachments";
import type {
  Attachment,
  AttachmentTarget,
} from "@/interface/attachment/attachment";
import { formatDateTime } from "@/utils/dateTime";
import { formatFileSize } from "@/utils/formatFileSize";
import { personName } from "@/utils/formatEnum";
import { Button } from "@/components/ui/button";
import AlertDialogComponent from "@/components/common/AlertDialogComponent";

interface AttachmentListProps {
  target: AttachmentTarget;
  // Uploaders may remove their own files while the target is not locked.
  allowRemoval: boolean;
}

const AttachmentList = ({ target, allowRemoval }: AttachmentListProps) => {
  const user = useUserStore((state) => state.user);
  const { attachments } = useGetAttachments(target);
  const { download } = useDownloadAttachment();
  const { remove } = useRemoveAttachment();
  const [removing, setRemoving] = useState<Attachment>();

  if (attachments.length === 0) {
    return <p className='text-sm text-muted-foreground'>No files attached.</p>;
  }

  return (
    <>
      <ul className='divide-y rounded-md border'>
        {attachments.map((attachment) => (
          <li key={attachment.id} className='flex items-center gap-3 p-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4'>
              {attachment.mimeType === "application/pdf" ? (
                <FileText />
              ) : (
                <Image />
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>
                {attachment.originalName}
              </p>
              {attachment.description && (
                <p className='truncate text-sm text-muted-foreground'>
                  {attachment.description}
                </p>
              )}
              <p className='text-xs text-muted-foreground'>
                {formatFileSize(attachment.sizeBytes)} ·{" "}
                {personName(attachment.uploadedBy)} ·{" "}
                {formatDateTime(attachment.createdAt)}
              </p>
            </div>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Download ${attachment.originalName}`}
              onClick={() => download(attachment).catch(() => {})}
            >
              <Download />
            </Button>
            {allowRemoval && attachment.uploadedBy.id === user?.id && (
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={`Remove ${attachment.originalName}`}
                onClick={() => setRemoving(attachment)}
              >
                <Trash2 />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <AlertDialogComponent
        open={!!removing}
        setOpen={(open) => !open && setRemoving(undefined)}
        title='Remove this file?'
        description={`"${removing?.originalName}" will no longer be listed. The file is kept on record.`}
        action={{
          label: "Remove",
          onClick: () => {
            if (removing) {
              remove(removing.id).catch(() => {});
            }
            setRemoving(undefined);
          },
        }}
      />
    </>
  );
};

export default AttachmentList;
