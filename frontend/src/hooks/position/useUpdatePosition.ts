import { useMutation, useQueryClient } from "@tanstack/react-query";
import positionService from "@/service/position.service";
import { showToast } from "@/utils/resubaleToast";

const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updatePosition,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: positionService.updatePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["positions"],
      });
      showToast({
        title: "Position Updated",
        description: "The Position has been updated successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Update Position",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { updatePosition, isPending, isError, error, isSuccess };
};

export default useUpdatePosition;
