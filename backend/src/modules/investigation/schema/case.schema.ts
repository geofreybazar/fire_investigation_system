import { z } from 'zod';

// Request schemas for investigation cases. The client never supplies the case
// number, the handling office or the station-derived location fields.
// The case fields are provisional until the official BFP forms are known.

const optionalDate = z.coerce.date().optional().nullable();

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const count = z.number().int().min(0);
const amount = z.number().min(0).optional().nullable();

const latitude = z.number().min(-90).max(90).nullable();
const longitude = z.number().min(-180).max(180).nullable();

const bothOrNeither = (location: { latitude?: unknown; longitude?: unknown }) =>
  (location.latitude === undefined) === (location.longitude === undefined) &&
  (location.latitude === null) === (location.longitude === null);

const coordinatesMessage = {
  message: 'Latitude and longitude must be given together',
};

export const impactSchema = z.object({
  fatalitiesCiv: count.optional(),
  injuredCiv: count.optional(),
  fatalitiesBFP: count.optional(),
  injuredBFP: count.optional(),
  fatalitiesLEA: count.optional(),
  injuredLEA: count.optional(),
  establishmentsBurned: count.optional(),
  familiesAffected: count.optional(),
  individualsAffected: count.optional(),
  estimatedDamages: amount,
  finalEstimatedDamages: amount,
});
export type CaseImpactInput = z.infer<typeof impactSchema>;

const caseDetails = {
  categoryId: z.uuid('Invalid category ID'),
  subcategoryId: z.uuid('Invalid subcategory ID').optional().nullable(),
  establishmentId: z.uuid('Invalid establishment ID').optional().nullable(),
  dateTimeFireIncident: optionalDate,
  dateTimeReported: optionalDate,
  dateTimeCallReceived: optionalDate,
  remarks: optionalText(2000),
};

export const createCaseSchema = z.object({
  ...caseDetails,
  // City/municipal station where the fire happened, within the creator's scope.
  stationId: z.uuid('Invalid station ID'),
  location: z
    .object({
      placeOfOccurence: text(500),
      barangay: text(200),
      latitude: latitude.optional(),
      longitude: longitude.optional(),
    })
    .refine(bothOrNeither, coordinatesMessage),
  impact: impactSchema.optional(),
  // The first investigation is created and assigned with the case.
  investigatorId: z.uuid('Invalid investigator ID'),
});
export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export const updateCaseSchema = z.object({
  categoryId: caseDetails.categoryId.optional(),
  subcategoryId: caseDetails.subcategoryId,
  establishmentId: caseDetails.establishmentId,
  dateTimeFireIncident: caseDetails.dateTimeFireIncident,
  dateTimeReported: caseDetails.dateTimeReported,
  dateTimeCallReceived: caseDetails.dateTimeCallReceived,
  remarks: caseDetails.remarks,
  location: z
    .object({
      placeOfOccurence: text(500).optional(),
      barangay: text(200).optional(),
      latitude: latitude.optional(),
      longitude: longitude.optional(),
    })
    .refine(bothOrNeither, coordinatesMessage)
    .optional(),
  impact: impactSchema.optional(),
});
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

export const deleteCaseSchema = z.object({
  reason: text(1000),
  // Reference of the memo approved by the Chief, BFP.
  memoReference: text(200),
});
export type DeleteCaseInput = z.infer<typeof deleteCaseSchema>;

export const CASE_STATES = ['OPEN', 'CLOSED'] as const;

export const listCasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // OPEN: an investigation is in progress. CLOSED: none is.
  state: z.enum(CASE_STATES).optional(),
  categoryId: z.uuid().optional(),
  search: z.string().trim().max(100).optional(),
  // Filters on the fire's date, or the case's creation time when unknown.
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>;

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
export type PageQuery = z.infer<typeof pageQuerySchema>;
