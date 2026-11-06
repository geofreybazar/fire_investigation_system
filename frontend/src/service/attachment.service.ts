import { axiosJWT } from "./AxiosCreate";
import type {
  Attachment,
  AttachmentTarget,
  PaginatedEvidence,
} from "@/interface/attachment/attachment";

const BASE_URL = "/api/attachments";

const listAttachments = async (
  target: AttachmentTarget,
): Promise<Attachment[]> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get(`/${target.kind}/${target.id}`);
  return response.data;
};

const uploadAttachment = async ({
  target,
  file,
  description,
}: {
  target: AttachmentTarget;
  file: File;
  description?: string;
}): Promise<Attachment> => {
  const form = new FormData();
  form.append("file", file);
  if (description) {
    form.append("description", description);
  }

  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.post(`/${target.kind}/${target.id}`, form);
  return response.data;
};

// Fetched through the authenticated client, then saved by the browser.
const downloadAttachment = async (attachment: Attachment) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get(`/${attachment.id}/download`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.originalName;
  link.click();
  URL.revokeObjectURL(url);
};

const removeAttachment = async (id: string) => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.delete(`/${id}`);
  return response.data;
};

const getEvidence = async (
  page: number,
  kind?: "case" | "investigation",
): Promise<PaginatedEvidence> => {
  const apiClient = await axiosJWT(BASE_URL);
  const response = await apiClient.get("/", {
    params: { page, ...(kind && { kind }) },
  });
  return response.data;
};

export default {
  listAttachments,
  uploadAttachment,
  downloadAttachment,
  removeAttachment,
  getEvidence,
};
