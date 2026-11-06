import { useMutation, useQueryClient } from "@tanstack/react-query";
import investigationService from "@/service/investigation.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useReviewReport = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: reviewReport, isPending } = useMutation({
    mutationFn: investigationService.reviewReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["investigation"] });
      queryClient.invalidateQueries({ queryKey: ["investigationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["assignedInvestigations"] });
      showToast({
        title: "Review Recorded",
        description: "Your decision on the report has been saved.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not record the review",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { reviewReport, isPending };
};

export default useReviewReport;
