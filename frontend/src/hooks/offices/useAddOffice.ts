import { useMutation, useQueryClient } from "@tanstack/react-query";
import officeService from "@/service/office.service";
import { showToast } from "@/utils/resubaleToast";

const useAddOffice = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: addNewOffice,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: officeService.createOffice,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["offices"],
      });
      showToast({
        title: "Office Added",
        description: "The office has been added successfully.",
        type: "success",
        priority: "low",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong";
      showToast({
        title: "Invalid input",
        description: message,
        type: "error",
        priority: "high",
      });
    },
  });
  return { addNewOffice, isPending, isError, error, isSuccess };
};

export default useAddOffice;
