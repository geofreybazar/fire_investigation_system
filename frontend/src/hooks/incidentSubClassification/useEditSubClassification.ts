import { useMutation, useQueryClient } from "@tanstack/react-query";
import incidentSubClassificationService from "@/service/incidentSubClassification.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useEditSubClassification = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: editSubClassification,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn:
      incidentSubClassificationService.editFireIncidentSubClassification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fireIncidentClassifications"],
      });
      showToast({
        title: "Sub-Classification Updated",
        description: "The Sub-Classification has been updated successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      const message = apiErrorMessage(error);
      showToast({
        title: "Unable to Update Sub-Classification",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { editSubClassification, isPending, isError, error, isSuccess };
};

export default useEditSubClassification;
