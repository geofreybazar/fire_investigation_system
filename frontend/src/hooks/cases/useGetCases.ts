import { useSuspenseQuery } from "@tanstack/react-query";
import caseService from "@/service/case.service";
import type { CaseListFilters } from "@/interface/case/case";

const useGetCases = (filters: CaseListFilters) => {
  const { data: cases, isFetching } = useSuspenseQuery({
    queryKey: ["cases", filters],
    queryFn: () => caseService.getCases(filters),
  });

  return { cases, isFetching };
};

export default useGetCases;
