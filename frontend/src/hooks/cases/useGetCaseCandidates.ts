import { useQuery } from "@tanstack/react-query";
import caseService from "@/service/case.service";

// Investigators of the case's handling office, loaded when the dialog opens.
const useGetCaseCandidates = (caseId: string, enabled: boolean) => {
  const { data: candidates, isLoading } = useQuery({
    queryKey: ["caseCandidates", caseId],
    queryFn: () => caseService.getCaseCandidates(caseId),
    enabled,
  });

  return { candidates: candidates ?? [], isLoading };
};

export default useGetCaseCandidates;
