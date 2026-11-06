import { useSuspenseQuery } from "@tanstack/react-query";
import incidentClassificationService from "@/service/incidentClassification.service";

const useGetClassification = (fireIncidentCategoryId: string) => {
  const {
    data: fireIncidentClassification,
    isLoading,
    isFetching,
    status,
    isError,
    error,
  } = useSuspenseQuery({
    queryKey: ["fireIncidentClassifications", fireIncidentCategoryId],
    queryFn: () =>
      incidentClassificationService.getFireIncidentClassificationById(
        fireIncidentCategoryId,
      ),
  });

  return {
    fireIncidentClassification,
    isLoading,
    isError,
    error,
    status,
    isFetching,
  };
};

export default useGetClassification;
