import { axiosJWT } from "./AxiosCreate";
import type {
  PaginatedPositions,
  Position,
  PositionInput,
  UpdatePositionInput,
} from "@/interface/positions/positions";

const addPostion = async (data: PositionInput) => {
  const apiClient = await axiosJWT("/api/position_api");
  const response = await apiClient.post("/", data);
  return response.data;
};

const updatePosition = async (data: UpdatePositionInput) => {
  const apiClient = await axiosJWT("/api/position_api");
  const response = await apiClient.patch(`/${data.positionId}`, data);
  return response.data;
};

const deletePosition = async (positionId: string) => {
  const apiClient = await axiosJWT("/api/position_api");
  const response = await apiClient.delete(`/${positionId}`);
  return response.data;
};

const getPositions = async (
  page: number,
  searchQuery: string,
): Promise<PaginatedPositions> => {
  const apiClient = await axiosJWT("/api/position_api");
  const response = await apiClient.get(`/?search=${searchQuery}&page=${page}`);
  return response.data;
};

const getAllPositions = async (): Promise<Pick<Position, "id" | "name">[]> => {
  const apiClient = await axiosJWT("/api/position_api");
  const response = await apiClient.get("/allpositions");
  return response.data;
};

export default {
  addPostion,
  getPositions,
  updatePosition,
  deletePosition,
  getAllPositions,
};
