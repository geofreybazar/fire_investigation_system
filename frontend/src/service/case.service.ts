import { axiosJWT } from "./AxiosCreate";
import type {
  CaseDetail,
  CaseListFilters,
  CreateCasePayload,
  DeletedCase,
  PaginatedCases,
  StationOption,
  UpdateCasePayload,
} from "@/interface/case/case";
import type { InvestigatorCandidate } from "@/interface/investigation/investigation";

const BASE_URL = "/api/case";

const getCases = async (filters: CaseListFilters): Promise<PaginatedCases> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get("/", {
    params: {
      page: filters.page,
      ...(filters.state && { state: filters.state }),
      ...(filters.search && { search: filters.search }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
    },
  });
  return response.data;
};

const getDeletedCases = async (
  page: number,
): Promise<PaginatedCases<DeletedCase>> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get("/deleted", { params: { page } });
  return response.data;
};

const getCase = async (id: string): Promise<CaseDetail> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get(`/${id}`);
  return response.data;
};

// Stations and investigators a chief can choose when opening a case.
const getCaseStations = async (): Promise<StationOption[]> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get("/stations");
  return response.data;
};

const getOwnInvestigators = async (): Promise<InvestigatorCandidate[]> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get("/investigators");
  return response.data;
};

const createCase = async (
  data: CreateCasePayload,
): Promise<{
  id: string;
  caseNo: string;
  investigation: { id: string; investigationNo: string };
}> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.post("/", data);
  return response.data;
};

const updateCase = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateCasePayload;
}) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.patch(`/${id}`, data);
  return response.data;
};

// SUPER_ADMIN only: a reason and the memo approved by the Chief, BFP.
const deleteCase = async ({
  id,
  reason,
  memoReference,
}: {
  id: string;
  reason: string;
  memoReference: string;
}) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.delete(`/${id}`, {
    data: { reason, memoReference },
  });
  return response.data;
};

const restoreCase = async (id: string) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.post(`/${id}/restore`);
  return response.data;
};

const getCaseCandidates = async (
  caseId: string,
): Promise<InvestigatorCandidate[]> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get(`/${caseId}/candidates`);
  return response.data;
};

const referCase = async ({
  caseId,
  toOfficeId,
  remarks,
}: {
  caseId: string;
  toOfficeId: string;
  remarks?: string;
}) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.post(`/${caseId}/refer`, {
    toOfficeId,
    ...(remarks && { remarks }),
  });
  return response.data;
};

const startInvestigation = async ({
  caseId,
  investigatorId,
}: {
  caseId: string;
  investigatorId: string;
}): Promise<{ id: string; investigationNo: string }> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.post(`/${caseId}/start`, {
    investigatorId,
  });
  return response.data;
};

export default {
  getCases,
  getDeletedCases,
  getCase,
  getCaseStations,
  getOwnInvestigators,
  createCase,
  updateCase,
  deleteCase,
  restoreCase,
  getCaseCandidates,
  referCase,
  startInvestigation,
};
