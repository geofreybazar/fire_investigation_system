import type { Pagination } from "../pagination";

// Mirrors backend/src/modules/attachment (REQUIREMENTS.md Q-22).

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
// For the file picker; the server checks the file's real content.
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";

export interface Attachment {
  id: string;
  caseId: string;
  investigationId: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  description: string | null;
  createdAt: string;
  uploadedBy: {
    id: string;
    rank: string;
    first_name: string;
    last_name: string;
  };
}

// Where an attachment belongs.
export type AttachmentTarget =
  { kind: "case"; id: string } | { kind: "investigation"; id: string };

export interface EvidenceAttachment extends Attachment {
  case: { id: string; caseNo: string };
  investigation: { id: string; investigationNo: string } | null;
}

export interface PaginatedEvidence {
  data: EvidenceAttachment[];
  pagination: Pagination;
}
