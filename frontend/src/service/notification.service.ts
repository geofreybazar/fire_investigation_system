import { axiosJWT } from "./AxiosCreate";
import type {
  NotificationSettings,
  PaginatedNotifications,
  UpdateNotifSettings,
} from "@/interface/notifications/notifications";

const getUserNotificationSettings = async (
  userId: string,
): Promise<NotificationSettings> => {
  const apiClient = await axiosJWT("/api/notification");
  const response = await apiClient.get(`/${userId}`);
  return response.data;
};

const updateNotificationSettings = async (
  data: UpdateNotifSettings,
): Promise<NotificationSettings> => {
  const apiClient = await axiosJWT("/api/notification");
  const response = await apiClient.patch(`/${data.userId}`, data);
  return response.data;
};

const getInbox = async (page: number): Promise<PaginatedNotifications> => {
  const apiClient = await axiosJWT("/api/notification");
  const response = await apiClient.get("/inbox", { params: { page } });
  return response.data;
};

const getUnreadCount = async (): Promise<{ unread: number }> => {
  const apiClient = await axiosJWT("/api/notification");
  const response = await apiClient.get("/unread-count");
  return response.data;
};

const markNotificationRead = async (id: string) => {
  const apiClient = await axiosJWT("/api/notification");
  const response = await apiClient.post(`/${id}/read`);
  return response.data;
};

const markAllNotificationsRead = async () => {
  const apiClient = await axiosJWT("/api/notification");
  const response = await apiClient.post("/read-all");
  return response.data;
};

export default {
  getUserNotificationSettings,
  updateNotificationSettings,
  getInbox,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
