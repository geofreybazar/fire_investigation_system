import { useSuspenseQuery } from "@tanstack/react-query";
import positionService from "@/service/position.service";

const useGetPositions = (page: number, searchQuery: string) => {
  const {
    data: positions,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["positions", page, searchQuery],
    queryFn: () => positionService.getPositions(page, searchQuery),
  });

  return { positions, isLoading, isError, error, status, isFetching };
};

export default useGetPositions;
