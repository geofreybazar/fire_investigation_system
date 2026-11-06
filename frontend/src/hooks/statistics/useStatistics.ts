import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import statisticsService from "@/service/statistics.service";
import type { StatisticsFilters } from "@/interface/statistics/statistics";
import { showToast } from "@/utils/resubaleToast";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

export const useGetStatisticsSummary = (filters: StatisticsFilters) => {
  const { data: summary, isFetching } = useSuspenseQuery({
    queryKey: ["statistics", "summary", filters],
    queryFn: () => statisticsService.getSummary(filters),
  });

  return { summary, isFetching };
};

export const useGetCaseReport = (filters: StatisticsFilters, page: number) => {
  const { data: report, isFetching } = useSuspenseQuery({
    queryKey: ["statistics", "caseReport", filters, page],
    queryFn: () => statisticsService.getCaseReport(filters, page),
  });

  return { report, isFetching };
};

export const useGetMapPoints = (filters: StatisticsFilters) => {
  const { data: points, isFetching } = useSuspenseQuery({
    queryKey: ["statistics", "mapPoints", filters],
    queryFn: () => statisticsService.getMapPoints(filters),
  });

  return { points, isFetching };
};

export const useDownloadCaseReport = () => {
  const { mutateAsync: download, isPending } = useMutation({
    mutationFn: statisticsService.downloadCaseReport,
    onSuccess: ({ truncated }) => {
      showToast({
        title: "Report downloaded",
        description: truncated
          ? "The report was cut off at 10,000 cases. Narrow the filters to export the rest."
          : "The case report was saved as a CSV file.",
        type: truncated ? "warning" : "success",
        priority: truncated ? "high" : "low",
      });
    },
    onError: (error) => {
      showToast({
        title: "Could not download the report",
        description: apiErrorMessage(error),
        type: "error",
        priority: "high",
      });
    },
  });

  return { download, isPending };
};
