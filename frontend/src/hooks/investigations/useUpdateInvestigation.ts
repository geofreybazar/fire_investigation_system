import { useMutation, useQueryClient } from "@tanstack/react-query";
import investigationService from "@/service/investigation.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useUpdateInvestigation = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateInvestigation, isPending } = useMutation({
    mutationFn: investigationService.updateInvestigation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["investigation"] });
      queryClient.invalidateQueries({ queryKey: ["investigationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["assignedInvestigations"] });
      showToast({
        title: "Investigation Saved",
        description: "Your changes have been saved.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not save the investigation",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { updateInvestigation, isPending };
};

export default useUpdateInvestigation;
