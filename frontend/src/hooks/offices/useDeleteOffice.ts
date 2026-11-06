import { useMutation, useQueryClient } from "@tanstack/react-query";
import officeService from "@/service/office.service";
import { showToast } from "@/utils/resubaleToast";

const useDeleteOffice = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteOffice,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: officeService.deleteOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["offices"],
      });
      showToast({
        title: "Office Deleted",
        description: "The office has been deleted successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Unable to Delete Office",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { deleteOffice, isPending, isError, error, isSuccess };
};

export default useDeleteOffice;
