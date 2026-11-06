import { useMutation, useQueryClient } from "@tanstack/react-query";
import caseService from "@/service/case.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useReferCase = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: referCase, isPending } = useMutation({
    mutationFn: caseService.referCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["investigation"] });
      queryClient.invalidateQueries({ queryKey: ["investigationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["assignedInvestigations"] });
      showToast({
        title: "Case Referred",
        description: "The case has been moved to the selected office.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not refer the case",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { referCase, isPending };
};

export default useReferCase;
