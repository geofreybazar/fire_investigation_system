import { axiosJWT } from "./AxiosCreate";
import type {
  AssignedItem,
  InvestigationDetail,
  InvestigationDraftPayload,
  Paginated,
  QueueItem,
  ReviewDecision,
} from "@/interface/investigation/investigation";

const BASE_URL = "/api/investigation";

const getInvestigation = async (id: string): Promise<InvestigationDetail> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get(`/${id}`);
  return response.data;
};

const updateInvestigation = async ({
  id,
  data,
}: {
  id: string;
  data: InvestigationDraftPayload;
}) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.patch(`/${id}`, data);
  return response.data;
};

const submitReport = async (id: string) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.post(`/${id}/submit`);
  return response.data;
};

const reviewReport = async ({
  id,
  decision,
  remarks,
}: {
  id: string;
  decision: ReviewDecision;
  remarks?: string;
}) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.post(`/${id}/review`, {
    decision,
    ...(remarks && { remarks }),
  });
  return response.data;
};

const getInvestigationQueue = async (
  page: number,
): Promise<Paginated<QueueItem>> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get("/queue", { params: { page } });
  return response.data;
};

const getAssignedInvestigations = async (
  page: number,
): Promise<Paginated<AssignedItem>> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get("/assigned", { params: { page } });
  return response.data;
};

export default {
  getInvestigation,
  updateInvestigation,
  submitReport,
  reviewReport,
  getInvestigationQueue,
  getAssignedInvestigations,
};
