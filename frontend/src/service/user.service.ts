import { axiosJWT } from "./AxiosCreate";
import type { Rank } from "@/constants/personnel";
import type {
  AddNewUserInput,
  ChangePasswordInput,
  ChangeUserStatus,
  EditUserInput,
  GetAllPersonnel,
  User,
} from "@/interface/users/users";

const getUser = async (userId: string): Promise<User> => {
  const apiClient = await axiosJWT("/api/users");
  const response = await apiClient.get(`/${userId}`);
  return response.data;
};

const getUsers = async (
  page: number,
  searchQuery: string,
  officeId: string,
  rank: Rank | undefined,
  status: "Active" | "Inactive",
): Promise<GetAllPersonnel> => {
  const apiClient = await axiosJWT("/api/users");
  const response = await apiClient.get("/", {
    params: {
      search: searchQuery,
      officeid: officeId,
      ...(rank && { rank }),
      status,
      page,
    },
  });
  return response.data;
};

const changePassword = async (data: ChangePasswordInput) => {
  const apiClient = await axiosJWT("/api/users");
  const response = await apiClient.patch("/", data);
  return response.data;
};

const addNewUser = async (data: AddNewUserInput) => {
  const apiClient = await axiosJWT("/api/users");
  const response = await apiClient.post("/", data);
  return response.data;
};

const changeUserStatus = async (data: ChangeUserStatus) => {
  const apiClient = await axiosJWT("/api/users");
  const response = await apiClient.patch(`${data.userId}`, {
    isActive: data.isActive,
  });
  return response.data;
};

const editUser = async (data: EditUserInput) => {
  const { userId, ...userData } = data;

  const apiClient = await axiosJWT("/api/users");
  const response = await apiClient.patch(`/edituser/${userId}`, userData);
  return response.data;
};

export default {
  getUser,
  getUsers,
  changePassword,
  addNewUser,
  changeUserStatus,
  editUser,
};
