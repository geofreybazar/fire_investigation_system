import { z } from 'zod';
import {
  CauseOfFire,
  FireCaseClassification,
  ReportDecision,
} from '../../../generated/prisma/enums.js';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const referCaseSchema = z.object({
  toOfficeId: z.uuid('Invalid office ID'),
  remarks: optionalText(1000),
});
export type ReferCaseInput = z.infer<typeof referCaseSchema>;

export const startInvestigationSchema = z.object({
  investigatorId: z.uuid('Invalid investigator ID'),
});
export type StartInvestigationInput = z.infer<typeof startInvestigationSchema>;

export const updateInvestigationSchema = z.object({
  causeOfFire: z.enum(CauseOfFire).optional().nullable(),
  classification: z.enum(FireCaseClassification).optional().nullable(),
  originOfFire: optionalText(2000),
  report: z
    .object({
      findings: optionalText(20000),
      cause: optionalText(5000),
      conclusion: optionalText(20000),
      recommendations: optionalText(20000),
    })
    .optional(),
});
export type UpdateInvestigationInput = z.infer<
  typeof updateInvestigationSchema
>;

export const reviewReportSchema = z
  .object({
    decision: z.enum(ReportDecision),
    remarks: optionalText(2000),
  })
  .refine(
    (review) => review.decision !== ReportDecision.REJECTED || !!review.remarks,
    {
      message: 'Remarks are required when rejecting a report',
      path: ['remarks'],
    },
  );
export type ReviewReportInput = z.infer<typeof reviewReportSchema>;

export const investigationPageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
export type InvestigationPageQuery = z.infer<typeof investigationPageSchema>;
