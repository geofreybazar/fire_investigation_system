import { useSuspenseQuery } from "@tanstack/react-query";
import caseService from "@/service/case.service";

const useGetCase = (id: string) => {
  const { data: investigationCase } = useSuspenseQuery({
    queryKey: ["case", id],
    queryFn: () => caseService.getCase(id),
  });

  return { investigationCase };
};

export default useGetCase;
