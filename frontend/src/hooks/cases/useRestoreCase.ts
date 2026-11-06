import { useMutation, useQueryClient } from "@tanstack/react-query";
import caseService from "@/service/case.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useRestoreCase = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: restoreCase, isPending } = useMutation({
    mutationFn: caseService.restoreCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["deletedCases"] });
      queryClient.invalidateQueries({ queryKey: ["investigation"] });
      queryClient.invalidateQueries({ queryKey: ["investigationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["assignedInvestigations"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      showToast({
        title: "Case Restored",
        description: "The case and its records are visible again.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not restore the case",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { restoreCase, isPending };
};

export default useRestoreCase;
