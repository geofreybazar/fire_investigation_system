import { useSuspenseQuery } from "@tanstack/react-query";
import positionService from "@/service/position.service";

const useGetAllPositions = () => {
  const {
    data: positions,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["positions"],
    queryFn: () => positionService.getAllPositions(),
  });

  return { positions, isLoading, isError, error, status, isFetching };
};

export default useGetAllPositions;
