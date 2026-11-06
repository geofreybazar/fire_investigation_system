import { axiosJWT } from "./AxiosCreate";
import type {
  AuditLogFilters,
  PaginatedAuditLogs,
} from "@/interface/audit/audit";

const getAuditLogs = async (
  filters: AuditLogFilters,
): Promise<PaginatedAuditLogs> => {
  const apiClient = await axiosJWT("/api/audit");
  const response = await apiClient.get("/", {
    params: {
      page: filters.page,
      ...(filters.action && { action: filters.action }),
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
    },
  });
  return response.data;
};

export default { getAuditLogs };
