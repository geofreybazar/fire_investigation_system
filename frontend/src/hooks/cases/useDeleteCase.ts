import { useMutation, useQueryClient } from "@tanstack/react-query";
import caseService from "@/service/case.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useDeleteCase = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: deleteCase, isPending } = useMutation({
    mutationFn: caseService.deleteCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["deletedCases"] });
      queryClient.invalidateQueries({ queryKey: ["investigation"] });
      queryClient.invalidateQueries({ queryKey: ["investigationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["assignedInvestigations"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      showToast({
        title: "Case Deleted",
        description: "The case and its records are now hidden.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not delete the case",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { deleteCase, isPending };
};

export default useDeleteCase;
