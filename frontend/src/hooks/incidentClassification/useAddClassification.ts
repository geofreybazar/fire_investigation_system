import { useMutation, useQueryClient } from "@tanstack/react-query";
import incidentClassificationService from "@/service/incidentClassification.service";
import { showToast } from "@/utils/resubaleToast";

const useAddClassification = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: addNewClassification,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: incidentClassificationService.addFireIncidentClassification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fireIncidentClassifications"],
      });
      showToast({
        title: "Classification Added",
        description: "The Classification has been added successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Add New Classification",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { addNewClassification, isPending, isError, error, isSuccess };
};

export default useAddClassification;
