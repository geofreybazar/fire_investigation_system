import { useSuspenseQuery } from "@tanstack/react-query";
import officeService from "@/service/office.service";

const useGetOffices = (
  page: number,
  searchQuery: string,
  officeType: string,
) => {
  const {
    data: offices,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["offices", page, searchQuery, officeType],
    queryFn: () => officeService.getOffices(page, searchQuery, officeType),
  });

  return { offices, isLoading, isError, error, status, isFetching };
};

export default useGetOffices;
