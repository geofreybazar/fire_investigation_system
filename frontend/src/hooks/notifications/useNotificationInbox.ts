import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import notificationService from "@/service/notification.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

// The navbar bell polls the unread count; the list loads when it's opened.

export const useGetUnreadCount = () => {
  const { data } = useQuery({
    queryKey: ["notificationCount"],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60_000,
  });

  return { unread: data?.unread ?? 0 };
};

export const useGetInbox = (page: number, enabled: boolean) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationService.getInbox(page),
    enabled,
  });

  return { inbox: data, isLoading, isError };
};

const useInvalidateInbox = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
  };
};

export const useMarkNotificationRead = () => {
  const invalidate = useInvalidateInbox();

  const { mutateAsync: markRead } = useMutation({
    mutationFn: notificationService.markNotificationRead,
    onSuccess: invalidate,
  });

  return { markRead };
};

export const useMarkAllNotificationsRead = () => {
  const invalidate = useInvalidateInbox();

  const { mutateAsync: markAllRead, isPending } = useMutation({
    mutationFn: notificationService.markAllNotificationsRead,
    onSuccess: invalidate,
    onError: (error) => {
      showToast({
        title: "Could not update notifications",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { markAllRead, isPending };
};
