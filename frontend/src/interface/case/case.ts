import z from "zod";
import type { Pagination } from "../pagination";
import type { CaseState, ReportStatus } from "@/constants/investigation";
import type {
  InvestigationSummary,
  ReferralTarget,
  Referral,
} from "../investigation/investigation";

// Investigation cases (REQUIREMENTS.md §4). The case fields are provisional
// until the official BFP forms are available.

export interface UserSummary {
  id: string;
  rank: string;
  first_name: string;
  last_name: string;
}

export interface OfficeSummary {
  id: string;
  name: string;
  type?: string;
}

export interface CaseLocation {
  placeOfOccurence: string;
  barangay: string;
  city_municipality: string;
  province_district: string;
  region: string;
  latitude?: string | null;
  longitude?: string | null;
}

export const IMPACT_FIELDS = [
  ["fatalitiesCiv", "Civilian fatalities"],
  ["injuredCiv", "Civilians injured"],
  ["fatalitiesBFP", "BFP fatalities"],
  ["injuredBFP", "BFP injured"],
  ["fatalitiesLEA", "Other agency fatalities"],
  ["injuredLEA", "Other agency injured"],
  ["establishmentsBurned", "Establishments burned"],
  ["familiesAffected", "Families affected"],
  ["individualsAffected", "Individuals affected"],
  ["estimatedDamages", "Estimated damages (PHP)"],
  ["finalEstimatedDamages", "Final estimated damages (PHP)"],
] as const;

export type ImpactKey = (typeof IMPACT_FIELDS)[number][0];
// Decimal columns arrive as strings.
export type CaseImpact = Record<ImpactKey, number | string | null>;

export interface CaseListItem {
  id: string;
  caseNo: string;
  dateTimeFireIncident: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  subcategory: { id: string; name: string } | null;
  station: OfficeSummary;
  handlingOffice: OfficeSummary;
  location: Pick<
    CaseLocation,
    | "placeOfOccurence"
    | "barangay"
    | "city_municipality"
    | "province_district"
    | "region"
  > | null;
  investigations: {
    id: string;
    investigationNo: string;
    completedAt: string | null;
    report: { status: ReportStatus } | null;
  }[];
}

export interface DeletedCase extends CaseListItem {
  deletedAt: string;
  deletionReason: string | null;
  deletionMemoReference: string | null;
  deletedBy: UserSummary | null;
}

export interface PaginatedCases<T = CaseListItem> {
  data: T[];
  pagination: Pagination;
}

export interface CaseDetail {
  id: string;
  caseNo: string;
  dateTimeFireIncident: string | null;
  dateTimeReported: string | null;
  dateTimeCallReceived: string | null;
  remarks: string | null;
  categoryId: string;
  subcategoryId: string | null;
  category: { id: string; name: string; type: string };
  subcategory: { id: string; name: string } | null;
  station: OfficeSummary;
  createdByOffice: OfficeSummary;
  handlingOffice: OfficeSummary;
  handlingOfficeId: string;
  createdBy: UserSummary;
  createdById: string;
  location: CaseLocation | null;
  impact: CaseImpact | null;
  createdAt: string;
  referrals: Referral[];
  investigations: InvestigationSummary[];
  // What the current user may do next.
  canDecide: boolean;
  canEdit: boolean;
  referralTargets: ReferralTarget[];
}

export interface StationOption {
  id: string;
  name: string;
  type: string;
  parent: { name: string } | null;
  region: { name: string } | null;
}

export interface CaseListFilters {
  page: number;
  state?: CaseState;
  categoryId?: string;
  search?: string;
  from?: string;
  to?: string;
}

// ----- Forms (validated again by the backend) -----

const optionalNumber = z.number().optional().nullable();

const coordinates = {
  latitude: optionalNumber.refine(
    (value) => value == null || (value >= -90 && value <= 90),
    "Latitude must be between -90 and 90",
  ),
  longitude: optionalNumber.refine(
    (value) => value == null || (value >= -180 && value <= 180),
    "Longitude must be between -180 and 180",
  ),
};

const bothOrNeither = (values: {
  latitude?: number | null;
  longitude?: number | null;
}) => (values.latitude == null) === (values.longitude == null);

const count = z.number().int().min(0).nullable().optional();
const amount = z.number().min(0).nullable().optional();

const impactFields = {
  fatalitiesCiv: count,
  injuredCiv: count,
  fatalitiesBFP: count,
  injuredBFP: count,
  fatalitiesLEA: count,
  injuredLEA: count,
  establishmentsBurned: count,
  familiesAffected: count,
  individualsAffected: count,
  estimatedDamages: amount,
  finalEstimatedDamages: amount,
};

const caseFields = {
  categoryId: z.string().min(1, "Select a category"),
  subcategoryId: z.string().optional(),
  placeOfOccurence: z.string().trim().min(1, "Place of occurrence is required"),
  barangay: z.string().trim().min(1, "Barangay is required"),
  ...coordinates,
  dateTimeFireIncident: z.string().optional(),
  dateTimeReported: z.string().optional(),
  dateTimeCallReceived: z.string().optional(),
  remarks: z.string().max(2000).optional(),
  ...impactFields,
};

const coordinatesMessage = {
  message: "Give both latitude and longitude, or neither",
  path: ["longitude"],
};

export const newCaseSchema = z
  .object({
    stationId: z.string().min(1, "Select the station"),
    investigatorId: z.string().min(1, "Select an investigator"),
    ...caseFields,
  })
  .refine(bothOrNeither, coordinatesMessage);
export type NewCaseFormValues = z.infer<typeof newCaseSchema>;

export const editCaseSchema = z
  .object(caseFields)
  .refine(bothOrNeither, coordinatesMessage);
export type EditCaseFormValues = z.infer<typeof editCaseSchema>;

// ----- Payloads -----

export type CaseImpactPayload = Partial<Record<ImpactKey, number | null>>;

export interface CaseLocationPayload {
  placeOfOccurence: string;
  barangay: string;
  latitude: number | null;
  longitude: number | null;
}

export interface CreateCasePayload {
  stationId: string;
  investigatorId: string;
  categoryId: string;
  subcategoryId: string | null;
  dateTimeFireIncident: string | null;
  dateTimeReported: string | null;
  dateTimeCallReceived: string | null;
  remarks: string | null;
  location: CaseLocationPayload;
  impact: CaseImpactPayload;
}

export type UpdateCasePayload = Partial<
  Omit<CreateCasePayload, "stationId" | "investigatorId">
>;
