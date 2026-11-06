import { useSuspenseQuery } from "@tanstack/react-query";
import notificationService from "@/service/notification.service";

const useGetUserNotificationSettings = (userId: string) => {
  const {
    data: notificationSettings,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["notificationSettings", userId],
    queryFn: () => notificationService.getUserNotificationSettings(userId),
  });

  return {
    notificationSettings,
    isLoading,
    isError,
    error,
    status,
    isFetching,
  };
};

export default useGetUserNotificationSettings;
