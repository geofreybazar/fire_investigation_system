import { useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "@/service/user.service";
import { showToast } from "@/utils/resubaleToast";

const useAddNewUser = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: addUser,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: userService.addNewUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      showToast({
        title: "Personnel was added",
        description: "New personnel was added successfully.",
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
  return { addUser, isPending, isError, error, isSuccess };
};

export default useAddNewUser;
