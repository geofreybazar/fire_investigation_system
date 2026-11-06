import { useMutation, useQueryClient } from "@tanstack/react-query";
import notificationService from "@/service/notification.service";
import { showToast } from "@/utils/resubaleToast";

const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateSettings,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: notificationService.updateNotificationSettings,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notificationSettings", variables],
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Error",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { updateSettings, isPending, isError, error, isSuccess };
};

export default useUpdateNotificationSettings;
