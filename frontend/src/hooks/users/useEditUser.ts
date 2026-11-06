import { useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "@/service/user.service";
import { showToast } from "@/utils/resubaleToast";

const useEditUser = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: editUser,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: userService.editUser,
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
        title: "Edit personnel information",
        description: "Personnel's information was updated successfully.",
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
  return { editUser, isPending, isError, error, isSuccess };
};

export default useEditUser;
