import { useMutation, useQueryClient } from "@tanstack/react-query";
import incidentClassificationService from "@/service/incidentClassification.service";
import { showToast } from "@/utils/resubaleToast";

const useDeleteClassification = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteClassification,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn:
      incidentClassificationService.deleteFireIncidentClassificationById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fireIncidentClassifications"],
      });
      showToast({
        title: "Classification Deleted",
        description: "The Classification has been deleted successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Delete Classification",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { deleteClassification, isPending, isError, error, isSuccess };
};

export default useDeleteClassification;
