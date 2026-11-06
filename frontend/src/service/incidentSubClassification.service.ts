import { axiosJWT } from "./AxiosCreate";
import type {
  EditFireIncidentSubCategoryInput,
  FireIncidentSubCategoriesInput,
} from "@/interface/incidentSubClassification/incidentSubClassification";

const addFireIncidentSubClassification = async (
  data: FireIncidentSubCategoriesInput,
) => {
  const apiClient = await axiosJWT("/api/fire_incident_subcategories_api");
  const response = await apiClient.post("/", data);
  return response.data;
};

const editFireIncidentSubClassification = async ({
  subcategoryId,
  ...data
}: EditFireIncidentSubCategoryInput & { subcategoryId: string }) => {
  const apiClient = await axiosJWT("/api/fire_incident_subcategories_api");
  const response = await apiClient.patch(`/${subcategoryId}`, data);
  return response.data;
};

const deleteFireIncidentSubClassification = async (subcategoryId: string) => {
  const apiClient = await axiosJWT("/api/fire_incident_subcategories_api");
  const response = await apiClient.delete(`/${subcategoryId}`);
  return response.data;
};

export default {
  addFireIncidentSubClassification,
  editFireIncidentSubClassification,
  deleteFireIncidentSubClassification,
};
