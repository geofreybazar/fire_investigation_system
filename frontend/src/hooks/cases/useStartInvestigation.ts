import { useMutation, useQueryClient } from "@tanstack/react-query";
import caseService from "@/service/case.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useStartInvestigation = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: startInvestigation, isPending } = useMutation({
    mutationFn: caseService.startInvestigation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["investigation"] });
      queryClient.invalidateQueries({ queryKey: ["investigationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["assignedInvestigations"] });
      showToast({
        title: "Investigation Started",
        description: "The investigator has been assigned.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not start the investigation",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { startInvestigation, isPending };
};

export default useStartInvestigation;
