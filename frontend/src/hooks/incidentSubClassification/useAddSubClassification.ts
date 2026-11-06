import { useMutation, useQueryClient } from "@tanstack/react-query";
import incidentSubClassificationService from "@/service/incidentSubClassification.service";
import { showToast } from "@/utils/resubaleToast";

const useAddSubClassification = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: addNewSubClassification,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn:
      incidentSubClassificationService.addFireIncidentSubClassification,
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: ["fireIncidentClassifications", data.categoryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["fireIncidentClassifications"],
      });
      showToast({
        title: "Sub-Classification Added",
        description: "The Sub-Classification has been added successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Add New Sub-Classification",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { addNewSubClassification, isPending, isError, error, isSuccess };
};

export default useAddSubClassification;
