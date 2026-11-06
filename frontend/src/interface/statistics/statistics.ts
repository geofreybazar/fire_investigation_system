import type { Pagination } from "../pagination";
import type { CaseState } from "@/constants/investigation";

// Mirrors backend/src/modules/statistics (REQUIREMENTS.md Q-20).

export const CATEGORY_TYPES = [
  "STRUCTURAL",
  "NON_STRUCTURAL",
  "TRANSPORTATION",
  "WILDLAND",
] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export interface StatisticsFilters {
  // ISO timestamps bounding the fire's date.
  from?: string;
  to?: string;
  state?: CaseState;
  categoryType?: CategoryType;
}

export interface Bucket {
  key: string;
  label: string;
  count: number;
}

export interface StatisticsSummary {
  totals: {
    cases: number;
    // With an investigation in progress.
    open: number;
    // With at least one approved investigation.
    investigated: number;
  };
  impact: {
    fatalitiesCiv: number;
    injuredCiv: number;
    fatalitiesBFP: number;
    injuredBFP: number;
    fatalitiesLEA: number;
    injuredLEA: number;
    establishmentsBurned: number;
    familiesAffected: number;
    individualsAffected: number;
    estimatedDamages: number;
    finalEstimatedDamages: number;
  };
  byCategoryType: Bucket[];
  byCategory: Bucket[];
  byMonth: Bucket[];
  byOffice: Bucket[];
  byCause: Bucket[];
  byClassification: Bucket[];
}

export interface CaseReportRow {
  id: string;
  caseNo: string;
  fireDate: string;
  state: CaseState;
  // The latest approved investigation, which statistics use.
  investigationNo: string | null;
  categoryType: CategoryType;
  category: string;
  subcategory: string | null;
  placeOfOccurence: string | null;
  barangay: string | null;
  cityMunicipality: string | null;
  provinceDistrict: string | null;
  region: string | null;
  station: string;
  handlingOffice: string;
  fatalitiesCiv: number;
  injuredCiv: number;
  fatalitiesBFP: number;
  injuredBFP: number;
  familiesAffected: number;
  estimatedDamages: number | null;
  classification: string | null;
  causeOfFire: string | null;
}

export interface PaginatedCaseReport {
  data: CaseReportRow[];
  pagination: Pagination;
}

export interface MapPoint {
  id: string;
  caseNo: string;
  state: CaseState;
  fireDate: string;
  category: string;
  latitude: number;
  longitude: number;
  place: string | null;
}
