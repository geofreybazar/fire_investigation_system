import { useQuery } from "@tanstack/react-query";
import caseService from "@/service/case.service";

// The stations within the chief's office and the office's investigators,
// for a new case.
const useGetCaseFormOptions = () => {
  const stations = useQuery({
    queryKey: ["caseStations"],
    queryFn: caseService.getCaseStations,
  });
  const investigators = useQuery({
    queryKey: ["ownInvestigators"],
    queryFn: caseService.getOwnInvestigators,
  });

  return {
    stations: stations.data ?? [],
    investigators: investigators.data ?? [],
    isLoading: stations.isLoading || investigators.isLoading,
  };
};

export default useGetCaseFormOptions;
