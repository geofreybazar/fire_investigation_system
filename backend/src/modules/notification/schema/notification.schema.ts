import { z } from 'zod';

export const notificationSchema = z.object({
  investigationUpdates: z.boolean(),
  reportReview: z.boolean(),
  systemAnnouncements: z.boolean(),
});

export const inboxQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
export type InboxQuery = z.infer<typeof inboxQuerySchema>;

export type NotificationInput = z.infer<typeof notificationSchema>;
