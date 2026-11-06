import { axiosJWT } from "./AxiosCreate";
import type {
  GetAllOffices,
  Office,
  OfficeInput,
  UpdateOfficeInput,
} from "@/interface/office/office";

const getOffices = async (
  page: number,
  searchQuery: string,
  officeType: string,
): Promise<GetAllOffices> => {
  const apiClient = await axiosJWT("/api/office_api");
  const response = await apiClient.get(
    `/?search=${searchQuery}&officetype=${officeType}&page=${page}`,
  );
  return response.data;
};

const getAllOffices = async (): Promise<Pick<Office, "id" | "name">[]> => {
  const apiClient = await axiosJWT("/api/office_api");
  const response = await apiClient.get("/alloffices");
  return response.data;
};

const createOffice = async (data: OfficeInput) => {
  const apiClient = await axiosJWT("/api/office_api");
  const response = await apiClient.post("/", data);
  return response.data;
};

const updateOffice = async (data: UpdateOfficeInput) => {
  const apiClient = await axiosJWT("/api/office_api");
  const response = await apiClient.patch(`/${data.officeId}`, data);
  return response.data;
};

const deleteOffice = async (officeId: string) => {
  const apiClient = await axiosJWT("/api/office_api");
  const response = await apiClient.delete(`/${officeId}`);
  return response.data;
};

export default {
  getOffices,
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
};
