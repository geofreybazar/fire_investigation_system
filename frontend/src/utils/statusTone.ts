import type { CaseState, ReportStatus } from "@/constants/investigation";

// One meaning per colour: red = rejected, amber = waiting or in progress,
// green = finished or approved, blue = being checked, grey = neutral. The tones use theme tokens (index.css) so dark mode keeps contrast.
export type Tone = "danger" | "warning" | "success" | "info" | "neutral";

export const TONE_CLASS: Record<Tone, string> = {
  danger: "border-transparent bg-destructive/10 text-destructive",
  warning: "border-transparent bg-warning/10 text-warning",
  success: "border-transparent bg-success/10 text-success",
  info: "border-transparent bg-info/10 text-info",
  neutral: "border-border text-muted-foreground",
};

// OPEN: an investigation in progress. CLOSED: none is.
export const CASE_STATE_TONE: Record<CaseState, Tone> = {
  OPEN: "warning",
  CLOSED: "success",
};

// A case is open while one of its investigations is not yet approved.
export const caseState = (
  investigations: { completedAt: string | null }[],
): CaseState =>
  investigations.some((investigation) => investigation.completedAt === null)
    ? "OPEN"
    : "CLOSED";

export const REPORT_TONE: Record<ReportStatus, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};
