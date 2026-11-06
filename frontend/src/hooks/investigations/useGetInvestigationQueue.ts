import { useSuspenseQuery } from "@tanstack/react-query";
import investigationService from "@/service/investigation.service";

const useGetInvestigationQueue = (page: number) => {
  const { data: queue, isFetching } = useSuspenseQuery({
    queryKey: ["investigationQueue", page],
    queryFn: () => investigationService.getInvestigationQueue(page),
  });

  return { queue, isFetching };
};

export default useGetInvestigationQueue;
