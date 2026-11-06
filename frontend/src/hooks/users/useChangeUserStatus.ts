import { useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "@/service/user.service";
import { showToast } from "@/utils/resubaleToast";

const useChangeUserStatus = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: changeUserStatus,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: userService.changeUserStatus,
    onSuccess: (result?: { warning?: string }) => {
      // FR-USR-015: allowed, but the station may now lack a required role.
      if (result?.warning) {
        showToast({
          title: "Station needs a replacement",
          description: result.warning,
          type: "warning",
          priority: "high",
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      showToast({
        title: "Change User Status",
        description: "Personnel's status was changed successfully.",
        type: "success",
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
  return { changeUserStatus, isPending, isError, error, isSuccess };
};

export default useChangeUserStatus;
