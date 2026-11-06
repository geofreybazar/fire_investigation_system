import {
  IMPACT_FIELDS,
  type CaseDetail,
  type CaseImpactPayload,
  type EditCaseFormValues,
  type UpdateCasePayload,
} from "@/interface/case/case";
import { fromLocalInput, toLocalInput } from "@/utils/dateTime";

const toNumber = (value?: number | string | null) =>
  value === null || value === undefined || value === "" ? null : Number(value);

// Empty impact fields are left out, so the backend keeps its defaults.
export const impactPayload = (values: EditCaseFormValues): CaseImpactPayload =>
  Object.fromEntries(
    IMPACT_FIELDS.map(([key]) => [key, values[key]]).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  );

// The fields the new-case and edit forms share, as the API expects them.
export const caseFieldsPayload = (
  values: EditCaseFormValues,
): Required<UpdateCasePayload> => ({
  categoryId: values.categoryId,
  subcategoryId: values.subcategoryId || null,
  dateTimeFireIncident: fromLocalInput(values.dateTimeFireIncident),
  dateTimeReported: fromLocalInput(values.dateTimeReported),
  dateTimeCallReceived: fromLocalInput(values.dateTimeCallReceived),
  remarks: values.remarks || null,
  location: {
    placeOfOccurence: values.placeOfOccurence,
    barangay: values.barangay,
    latitude: values.latitude ?? null,
    longitude: values.longitude ?? null,
  },
  impact: impactPayload(values),
});

export const editDefaults = (detail: CaseDetail): EditCaseFormValues => ({
  categoryId: detail.categoryId,
  subcategoryId: detail.subcategoryId ?? undefined,
  placeOfOccurence: detail.location?.placeOfOccurence ?? "",
  barangay: detail.location?.barangay ?? "",
  latitude: toNumber(detail.location?.latitude),
  longitude: toNumber(detail.location?.longitude),
  dateTimeFireIncident: toLocalInput(detail.dateTimeFireIncident),
  dateTimeReported: toLocalInput(detail.dateTimeReported),
  dateTimeCallReceived: toLocalInput(detail.dateTimeCallReceived),
  remarks: detail.remarks ?? "",
  ...Object.fromEntries(
    IMPACT_FIELDS.map(([key]) => [key, toNumber(detail.impact?.[key])]),
  ),
});
