import { useMutation, useQueryClient } from "@tanstack/react-query";
import positionService from "@/service/position.service";
import { showToast } from "@/utils/resubaleToast";

const useDeletePosition = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deletePosition,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: positionService.deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["positions"],
      });
      showToast({
        title: "Position Deleted",
        description: "The poisition has been deleted successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Delete Position",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { deletePosition, isPending, isError, error, isSuccess };
};

export default useDeletePosition;
