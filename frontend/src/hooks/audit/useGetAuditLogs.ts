import { useSuspenseQuery } from "@tanstack/react-query";
import auditService from "@/service/audit.service";
import type { AuditLogFilters } from "@/interface/audit/audit";

const useGetAuditLogs = (filters: AuditLogFilters) => {
  const { data: auditLogs, isFetching } = useSuspenseQuery({
    queryKey: ["auditLogs", filters],
    queryFn: () => auditService.getAuditLogs(filters),
  });

  return { auditLogs, isFetching };
};

export default useGetAuditLogs;
