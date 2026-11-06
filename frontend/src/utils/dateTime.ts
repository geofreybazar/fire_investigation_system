import { format } from "date-fns";

// Value for <input type="datetime-local"> in the browser's time zone.
export const toLocalInput = (value?: string | Date | null) =>
  value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : "";

// A datetime-local value back to an ISO timestamp; empty stays empty.
export const fromLocalInput = (value?: string | null) =>
  value ? new Date(value).toISOString() : null;

export const nowLocalInput = () => toLocalInput(new Date());

export const formatDateTime = (value?: string | Date | null) =>
  value ? format(new Date(value), "MMM d, yyyy h:mm a") : "—";
