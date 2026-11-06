import { useSuspenseQuery } from "@tanstack/react-query";
import incidentClassificationService from "@/service/incidentClassification.service";

// Every category, for dropdowns. The API returns 10 per page, so this reads
// the remaining pages after the first.
const useGetAllClassifications = () => {
  const { data } = useSuspenseQuery({
    queryKey: ["fireIncidentClassifications", "all"],
    queryFn: async () => {
      const first =
        await incidentClassificationService.getFireIncidentClassifications(
          1,
          "",
        );
      const rest = await Promise.all(
        Array.from({ length: first.pagination.totalPages - 1 }, (_, i) =>
          incidentClassificationService.getFireIncidentClassifications(
            i + 2,
            "",
          ),
        ),
      );
      return [first, ...rest].flatMap((page) => page.data);
    },
  });

  return { categories: data };
};

export default useGetAllClassifications;
