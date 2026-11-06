import { useSuspenseQuery } from "@tanstack/react-query";
import investigationService from "@/service/investigation.service";

const useGetInvestigation = (id: string) => {
  const { data: investigation, isFetching } = useSuspenseQuery({
    queryKey: ["investigation", id],
    queryFn: () => investigationService.getInvestigation(id),
  });

  return { investigation, isFetching };
};

export default useGetInvestigation;
