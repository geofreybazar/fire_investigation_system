import axios from "axios";
import { useUserStore } from "@/store/userStore";

let refreshPromise: Promise<unknown> | null = null;

export const axiosJWT = async (baseUrl: string) => {
  const newAxios = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
  });

  newAxios.interceptors.request.use(
    async (config) => {
      return config;
    },
    (error) => Promise.reject(error),
  );

  newAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const user = useUserStore.getState().user;

      const originalRequest = error.config;

      if (originalRequest.url.includes("/login")) {
        return Promise.reject(error);
      }
      console.log(error.response.data);

      if (error.response.data.error === "Unauthorized") {
        console.error("Invalid refresh token");
        window.location.href = "/login";
        alert("Unauthorize access. Login out!");
        window.localStorage.removeItem("user");
      }

      // Shows the change-password screen (the session started on another device).
      if (user && error.response.data.error === "PASSWORD_CHANGE_REQUIRED") {
        useUserStore.getState().setUser({ ...user, mustChangePassword: true });
      }

      if (
        !originalRequest._retry &&
        user &&
        error.response.data.error === "TOKEN_EXPIRED"
      ) {
        originalRequest._retry = true;
        console.log("Access token expired, attempting to refresh...");

        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post("/api/auth/refresh_token", {}, { withCredentials: true })
              .finally(() => {
                refreshPromise = null;
              });
          }

          await refreshPromise;

          return newAxios(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token failed. Logging out...");
          window.location.href = "/login";
          alert("Login session expires");
          window.localStorage.removeItem("user");
        }
      }

      return Promise.reject(error);
    },
  );
  return newAxios;
};
