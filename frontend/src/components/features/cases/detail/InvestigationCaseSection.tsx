import { useState } from "react";
import { Link } from "react-router";
import { ArrowDown, ArrowUp, Send, UserPlus } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import useGetCaseCandidates from "@/hooks/cases/useGetCaseCandidates";
import useReferCase from "@/hooks/cases/useReferCase";
import useStartInvestigation from "@/hooks/cases/useStartInvestigation";
import type { CaseDetail } from "@/interface/case/case";
import { formatEnum, personName } from "@/utils/formatEnum";
import { formatDateTime } from "@/utils/dateTime";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import { SelectField, TextareaField } from "@/components/common/form/FormFields";
import { ReportStatusBadge } from "../StatusBadges";

const referSchema = z.object({
  toOfficeId: z.string().min(1, "Select an office"),
  remarks: z.string().max(1000).optional(),
});
type ReferValues = z.infer<typeof referSchema>;

const startSchema = z.object({
  investigatorId: z.string().min(1, "Select an investigator"),
});
type StartValues = z.infer<typeof startSchema>;

const ignoreError = () => {}; // The hooks already show the error.

// The case's investigations and referrals, and the handling chief's
// decision: start a further investigation, refer the case, or leave it.
const InvestigationCaseSection = ({
  investigationCase,
}: {
  investigationCase: CaseDetail;
}) => {
  const caseId = investigationCase.id;
  const [dialog, setDialog] = useState<"refer" | "start" | null>(null);
  const { candidates, isLoading } = useGetCaseCandidates(
    caseId,
    dialog === "start",
  );
  const { referCase, isPending: isReferring } = useReferCase();
  const { startInvestigation, isPending: isStarting } = useStartInvestigation();

  const referForm = useForm<ReferValues>({
    resolver: zodResolver(referSchema),
    defaultValues: { toOfficeId: "", remarks: "" },
  });
  const startForm = useForm<StartValues>({
    resolver: zodResolver(startSchema),
    defaultValues: { investigatorId: "" },
  });

  const close = () => setDialog(null);
  const { canDecide } = investigationCase;

  return (
    <Card>
      <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-2'>
        <div>
          <CardTitle className='text-base'>Investigations</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Handled by {investigationCase.handlingOffice.name}
          </p>
        </div>
        {canDecide && (
          <div className='flex gap-2'>
            <Button size='sm' onClick={() => setDialog("start")}>
              <UserPlus className='size-4' />
              Start investigation
            </Button>
            {investigationCase.referralTargets.length > 0 && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setDialog("refer")}
              >
                <Send className='size-4' />
                Refer
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        {investigationCase.investigations.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No investigation yet.</p>
        ) : (
          <ul className='space-y-2'>
            {investigationCase.investigations.map((investigation) => (
              <li
                key={investigation.id}
                className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'
              >
                <div>
                  <Link
                    to={`/investigations/${investigation.id}`}
                    className='font-medium underline-offset-4 hover:underline'
                  >
                    {investigation.investigationNo}
                  </Link>
                  <p className='text-xs text-muted-foreground'>
                    {investigation.conductingOffice.name} ·{" "}
                    {personName(investigation.assignedInvestigator)} · started{" "}
                    {formatDateTime(investigation.startedAt)}
                  </p>
                </div>
                <ReportStatusBadge status={investigation.report?.status} />
              </li>
            ))}
          </ul>
        )}

        {investigationCase.referrals.length > 0 && (
          <div className='space-y-1'>
            <p className='text-sm font-medium'>Referrals</p>
            {investigationCase.referrals.map((referral) => (
              <p key={referral.id} className='text-sm text-muted-foreground'>
                {referral.direction === "UP" ? (
                  <ArrowUp className='mr-1 inline size-3.5' />
                ) : (
                  <ArrowDown className='mr-1 inline size-3.5' />
                )}
                {referral.fromOffice.name} → {referral.toOffice.name} by{" "}
                {personName(referral.referredBy)},{" "}
                {formatDateTime(referral.createdAt)}
                {referral.remarks && ` — “${referral.remarks}”`}
              </p>
            ))}
          </div>
        )}
      </CardContent>

      <NoButtonDialogComponent
        open={dialog === "refer"}
        modalOnChange={(open) => !open && close()}
        dialogTitle='Refer Case'
        dialogDescription="Move the case to another office in this station's chain. That office's chief investigator decides next."
      >
        <FormProvider {...referForm}>
          <form
            className='flex flex-col gap-3'
            onSubmit={referForm.handleSubmit((values) =>
              referCase({ caseId, ...values })
                .then(() => {
                  referForm.reset();
                  close();
                })
                .catch(ignoreError),
            )}
          >
            <SelectField<ReferValues>
              name='toOfficeId'
              label='Refer to'
              placeholder='Select office'
              options={investigationCase.referralTargets.map((office) => ({
                value: office.id,
                label: `${office.name} (${formatEnum(office.direction)})`,
              }))}
            />
            <TextareaField<ReferValues> name='remarks' label='Remarks (optional)' />
            <Button type='submit' disabled={isReferring}>
              {isReferring ? <Spinner /> : "Refer case"}
            </Button>
          </form>
        </FormProvider>
      </NoButtonDialogComponent>

      <NoButtonDialogComponent
        open={dialog === "start"}
        modalOnChange={(open) => !open && close()}
        dialogTitle='Start Investigation'
        dialogDescription="Assign an investigator of your office. The assignment can't be changed until the report is approved."
      >
        <FormProvider {...startForm}>
          <form
            className='flex flex-col gap-3'
            onSubmit={startForm.handleSubmit((values) =>
              startInvestigation({ caseId, ...values })
                .then(() => {
                  startForm.reset();
                  close();
                })
                .catch(ignoreError),
            )}
          >
            <SelectField<StartValues>
              name='investigatorId'
              label='Investigator'
              placeholder={isLoading ? "Loading..." : "Select investigator"}
              options={candidates.map((candidate) => ({
                value: candidate.id,
                label: personName(candidate),
              }))}
            />
            {!isLoading && candidates.length === 0 && (
              <p className='text-sm text-muted-foreground'>
                Your office has no active investigators.
              </p>
            )}
            <Button type='submit' disabled={isStarting}>
              {isStarting ? <Spinner /> : "Start and assign"}
            </Button>
          </form>
        </FormProvider>
      </NoButtonDialogComponent>
    </Card>
  );
};

export default InvestigationCaseSection;
