import { axiosJWT } from "./AxiosCreate";
import type {
  EditFireIncidentCategoriesInput,
  FireIncidentCategoriesInput,
  FireIncidentCategory,
  GetAllFireIncidentCategories,
} from "@/interface/incidentClassification/incidentClassification";

const addFireIncidentClassification = async (
  data: FireIncidentCategoriesInput,
) => {
  const apiClient = await axiosJWT("/api/fire_incident_categories_api");
  const response = await apiClient.post("/", data);
  return response.data;
};

const getFireIncidentClassifications = async (
  page: number,
  searchQuery: string,
): Promise<GetAllFireIncidentCategories> => {
  const apiClient = await axiosJWT("/api/fire_incident_categories_api");
  const response = await apiClient.get(`/?search=${searchQuery}&page=${page}`);
  return response.data;
};

const editFireIncidentClassifications = async (
  data: EditFireIncidentCategoriesInput,
): Promise<GetAllFireIncidentCategories> => {
  const { fireIncidentCategoryId, ...incidentClassificationData } = data;

  const apiClient = await axiosJWT("/api/fire_incident_categories_api");
  const response = await apiClient.patch(
    `/${fireIncidentCategoryId}`,
    incidentClassificationData,
  );
  return response.data;
};

const getFireIncidentClassificationById = async (
  fireIncidentCategoryId: string,
): Promise<FireIncidentCategory> => {
  const apiClient = await axiosJWT("/api/fire_incident_categories_api");
  const response = await apiClient.get(`/${fireIncidentCategoryId}`);
  return response.data;
};

const deleteFireIncidentClassificationById = async (
  fireIncidentCategoryId: string,
) => {
  const apiClient = await axiosJWT("/api/fire_incident_categories_api");
  const response = await apiClient.delete(`/${fireIncidentCategoryId}`);
  return response.data;
};

export default {
  addFireIncidentClassification,
  getFireIncidentClassifications,
  getFireIncidentClassificationById,
  editFireIncidentClassifications,
  deleteFireIncidentClassificationById,
};
