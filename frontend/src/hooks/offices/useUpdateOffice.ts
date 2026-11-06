import { useMutation, useQueryClient } from "@tanstack/react-query";
import officeService from "@/service/office.service";
import { showToast } from "@/utils/resubaleToast";

const useUpdateOffice = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateOffice,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: officeService.updateOffice,
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: ["offices", data.officeId],
      });
      showToast({
        title: "Office Updated",
        description: "The office has been updated successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Update Failled",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { updateOffice, isPending, isError, error, isSuccess };
};

export default useUpdateOffice;
