import { useSuspenseQuery } from "@tanstack/react-query";
import caseService from "@/service/case.service";

const useGetDeletedCases = (page: number) => {
  const { data: deletedCases } = useSuspenseQuery({
    queryKey: ["deletedCases", page],
    queryFn: () => caseService.getDeletedCases(page),
  });

  return { deletedCases };
};

export default useGetDeletedCases;
