import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import attachmentService from "@/service/attachment.service";
import type { AttachmentTarget } from "@/interface/attachment/attachment";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const errorToast = (title: string) => (error: unknown) =>
  showToast({
    title,
    description: apiErrorMessage(error),
    type: "error",
    priority: "high",
  });

export const useGetAttachments = (target: AttachmentTarget) => {
  const { data: attachments } = useSuspenseQuery({
    queryKey: ["attachments", target.kind, target.id],
    queryFn: () => attachmentService.listAttachments(target),
  });

  return { attachments };
};

export const useGetEvidence = (
  page: number,
  kind?: "case" | "investigation",
) => {
  const { data: evidence } = useSuspenseQuery({
    queryKey: ["evidence", page, kind],
    queryFn: () => attachmentService.getEvidence(page, kind),
  });

  return { evidence };
};

const useInvalidateAttachments = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["attachments"] });
    queryClient.invalidateQueries({ queryKey: ["evidence"] });
  };
};

export const useUploadAttachment = () => {
  const invalidate = useInvalidateAttachments();

  const { mutateAsync: upload, isPending } = useMutation({
    mutationFn: attachmentService.uploadAttachment,
    onSuccess: () => {
      invalidate();
      showToast({
        title: "File attached",
        description: "The file was uploaded.",
        type: "success",
        priority: "low",
      });
    },
    onError: errorToast("Could not upload the file"),
  });

  return { upload, isPending };
};

export const useRemoveAttachment = () => {
  const invalidate = useInvalidateAttachments();

  const { mutateAsync: remove } = useMutation({
    mutationFn: attachmentService.removeAttachment,
    onSuccess: () => {
      invalidate();
      showToast({
        title: "File removed",
        description: "The file is no longer listed.",
        type: "success",
        priority: "low",
      });
    },
    onError: errorToast("Could not remove the file"),
  });

  return { remove };
};

export const useDownloadAttachment = () => {
  const { mutateAsync: download, isPending } = useMutation({
    mutationFn: attachmentService.downloadAttachment,
    onError: errorToast("Could not download the file"),
  });

  return { download, isPending };
};
