import axios from "axios";
import type { LoginType } from "@/interface/login";
import { axiosJWT } from "./AxiosCreate";

const login = async (credentials: LoginType) => {
  const apiClient = await axiosJWT("/api/auth");
  const response = await apiClient.post("/login", credentials);
  return response.data;
};

const logout = async () => {
  const apiClient = await axiosJWT("/api/auth");
  const response = await apiClient.post("/logout");
  return response.data;
};

// Issues tokens that reflect the user's current state.
const refreshSession = async () => {
  await axios.post("/api/auth/refresh_token", {}, { withCredentials: true });
};

export default { login, logout, refreshSession };
