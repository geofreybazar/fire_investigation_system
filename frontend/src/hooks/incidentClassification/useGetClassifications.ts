import { useSuspenseQuery } from "@tanstack/react-query";
import incidentClassificationService from "@/service/incidentClassification.service";

const useGetClassifications = (page: number, searchQuery: string) => {
  const {
    data: fireIncidentClassifications,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["fireIncidentClassifications", page, searchQuery],
    queryFn: () =>
      incidentClassificationService.getFireIncidentClassifications(
        page,
        searchQuery,
      ),
  });

  return {
    fireIncidentClassifications,
    isLoading,
    isError,
    error,
    status,
    isFetching,
  };
};

export default useGetClassifications;
