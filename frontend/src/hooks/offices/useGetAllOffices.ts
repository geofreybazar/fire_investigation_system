import { useSuspenseQuery } from "@tanstack/react-query";
import officeService from "@/service/office.service";

const useGetAllOffices = () => {
  const {
    data: offices,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["offices"],
    queryFn: () => officeService.getAllOffices(),
  });

  return { offices, isLoading, isError, error, status, isFetching };
};

export default useGetAllOffices;
