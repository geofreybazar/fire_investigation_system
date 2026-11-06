import { useMutation } from "@tanstack/react-query";
import userService from "@/service/user.service";
import { showToast } from "@/utils/resubaleToast";

const useChangePassword = () => {
  const {
    mutateAsync: changePassword,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      showToast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
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
  return { changePassword, isPending, isError, error, isSuccess };
};

export default useChangePassword;
