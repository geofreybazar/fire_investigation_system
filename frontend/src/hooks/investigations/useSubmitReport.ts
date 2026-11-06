import { useMutation, useQueryClient } from "@tanstack/react-query";
import investigationService from "@/service/investigation.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useSubmitReport = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: submitReport, isPending } = useMutation({
    mutationFn: investigationService.submitReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["investigation"] });
      queryClient.invalidateQueries({ queryKey: ["investigationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["assignedInvestigations"] });
      showToast({
        title: "Report Submitted",
        description: "The report is waiting for the chief investigator's review.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not submit the report",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { submitReport, isPending };
};

export default useSubmitReport;
