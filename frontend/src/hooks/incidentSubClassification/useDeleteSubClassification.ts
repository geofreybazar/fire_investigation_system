import { useMutation, useQueryClient } from "@tanstack/react-query";
import incidentSubClassificationService from "@/service/incidentSubClassification.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useDeleteSubClassification = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteSubClassification,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn:
      incidentSubClassificationService.deleteFireIncidentSubClassification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fireIncidentClassifications"],
      });
      showToast({
        title: "Sub-Classification Deleted",
        description: "The Sub-Classification has been deleted successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      const message = apiErrorMessage(error);
      showToast({
        title: "Unable to Delete Sub-Classification",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { deleteSubClassification, isPending, isError, error, isSuccess };
};

export default useDeleteSubClassification;
