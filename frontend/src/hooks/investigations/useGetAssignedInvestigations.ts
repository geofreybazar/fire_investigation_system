import { useSuspenseQuery } from "@tanstack/react-query";
import investigationService from "@/service/investigation.service";

const useGetAssignedInvestigations = (page: number) => {
  const { data: assigned, isFetching } = useSuspenseQuery({
    queryKey: ["assignedInvestigations", page],
    queryFn: () => investigationService.getAssignedInvestigations(page),
  });

  return { assigned, isFetching };
};

export default useGetAssignedInvestigations;
