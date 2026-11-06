import { z } from 'zod';
import { CATEGORY_TYPE } from '../../../generated/prisma/enums.js';
import { CASE_STATES } from '../../investigation/schema/case.schema.js';

// Filters shared by the summary, the report and the map. Dates bound the
// fire's date, or the case's creation date when it is blank.
const filters = {
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  // OPEN: an investigation is in progress. CLOSED: none is.
  state: z.enum(CASE_STATES).optional(),
  categoryType: z.enum(CATEGORY_TYPE).optional(),
};

const validRange = (query: { from?: Date; to?: Date }) =>
  !query.from || !query.to || query.from <= query.to;

const rangeMessage = { message: "'from' must not be after 'to'" };

export const statisticsQuerySchema = z
  .object(filters)
  .refine(validRange, rangeMessage);
export type StatisticsQuery = z.infer<typeof statisticsQuerySchema>;

export const reportQuerySchema = z
  .object({ page: z.coerce.number().int().min(1).default(1), ...filters })
  .refine(validRange, rangeMessage);
export type ReportQuery = z.infer<typeof reportQuerySchema>;
