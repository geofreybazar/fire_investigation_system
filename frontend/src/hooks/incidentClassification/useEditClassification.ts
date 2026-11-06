import { useMutation, useQueryClient } from "@tanstack/react-query";
import incidentClassificationService from "@/service/incidentClassification.service";
import { showToast } from "@/utils/resubaleToast";

const useEditClassification = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: editClassification,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: incidentClassificationService.editFireIncidentClassifications,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fireIncidentClassifications"],
      });
      showToast({
        title: "Classification Edited",
        description: "The Classification has been edited successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Edit Classification",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { editClassification, isPending, isError, error, isSuccess };
};

export default useEditClassification;
