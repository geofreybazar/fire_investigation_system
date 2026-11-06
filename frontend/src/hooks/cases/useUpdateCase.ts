import { useMutation, useQueryClient } from "@tanstack/react-query";
import caseService from "@/service/case.service";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const useUpdateCase = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateCase, isPending } = useMutation({
    mutationFn: caseService.updateCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      showToast({
        title: "Case Updated",
        description: "The case details were saved.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not update the case",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { updateCase, isPending };
};

export default useUpdateCase;
