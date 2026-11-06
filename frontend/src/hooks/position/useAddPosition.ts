import { useMutation, useQueryClient } from "@tanstack/react-query";
import positionService from "@/service/position.service";
import { showToast } from "@/utils/resubaleToast";

const useAddPosition = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: addNewPosition,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: positionService.addPostion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["positions"],
      });
      showToast({
        title: "Position Added",
        description: "The Position has been added successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Add New Position",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { addNewPosition, isPending, isError, error, isSuccess };
};

export default useAddPosition;
