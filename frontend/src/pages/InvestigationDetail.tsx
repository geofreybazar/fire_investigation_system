import { Suspense, useState } from "react";
import { Link, useParams } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { ArrowLeft, CheckCircle2, Eye, Send, XCircle } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserStore } from "@/store/userStore";
import useGetInvestigation from "@/hooks/investigations/useGetInvestigation";
import useUpdateInvestigation from "@/hooks/investigations/useUpdateInvestigation";
import useSubmitReport from "@/hooks/investigations/useSubmitReport";
import useReviewReport from "@/hooks/investigations/useReviewReport";
import {
  investigationDraftSchema,
  type InvestigationDetail as Investigation,
  type InvestigationDraftFormValues,
} from "@/interface/investigation/investigation";
import {
  CAUSES_OF_FIRE,
  FIRE_CASE_CLASSIFICATIONS,
  type CauseOfFire,
  type FireCaseClassification,
} from "@/constants/investigation";
import {
  isChiefInvestigator,
  isSuperAdmin,
} from "@/utils/casePermissions";
import { enumOptions, formatEnum, personName } from "@/utils/formatEnum";
import { formatDateTime } from "@/utils/dateTime";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import NoButtonDialogComponent from "@/components/common/NoButtonDialogComponent";
import AlertDialogComponent from "@/components/common/AlertDialogComponent";
import {
  SelectField,
  TextareaField,
} from "@/components/common/form/FormFields";
import ReasonForm from "@/components/features/cases/form/ReasonForm";
import { ReportStatusBadge } from "@/components/features/cases/StatusBadges";
import AttachmentsCard from "@/components/features/attachments/AttachmentsCard";

const EDITABLE = ["DRAFT", "REJECTED"];
const REVIEWABLE = ["SUBMITTED", "UNDER_REVIEW"];

const ignoreError = () => {}; // The hooks already show the error.

const DraftForm = ({ investigation }: { investigation: Investigation }) => {
  const { updateInvestigation, isPending } = useUpdateInvestigation();
  const report = investigation.report;

  const methods = useForm<InvestigationDraftFormValues>({
    resolver: zodResolver(investigationDraftSchema),
    defaultValues: {
      classification: investigation.classification ?? "",
      causeOfFire: investigation.causeOfFire ?? "",
      originOfFire: investigation.originOfFire ?? "",
      findings: report?.findings ?? "",
      cause: report?.cause ?? "",
      conclusion: report?.conclusion ?? "",
      recommendations: report?.recommendations ?? "",
    },
  });

  const onSubmit = (values: InvestigationDraftFormValues) =>
    updateInvestigation({
      id: investigation.id,
      data: {
        classification:
          (values.classification as FireCaseClassification) || null,
        causeOfFire: (values.causeOfFire as CauseOfFire) || null,
        originOfFire: values.originOfFire || null,
        report: {
          findings: values.findings || null,
          cause: values.cause || null,
          conclusion: values.conclusion || null,
          recommendations: values.recommendations || null,
        },
      },
    }).catch(ignoreError);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='flex flex-col gap-3'
      >
        <div className='grid gap-3 sm:grid-cols-2'>
          <SelectField<InvestigationDraftFormValues>
            name='classification'
            label='Classification'
            options={enumOptions(FIRE_CASE_CLASSIFICATIONS)}
          />
          <SelectField<InvestigationDraftFormValues>
            name='causeOfFire'
            label='Cause of fire'
            options={enumOptions(CAUSES_OF_FIRE)}
          />
        </div>
        <TextareaField<InvestigationDraftFormValues>
          name='originOfFire'
          label='Origin of fire'
          rows={2}
        />
        <TextareaField<InvestigationDraftFormValues>
          name='findings'
          label='Findings'
          rows={5}
        />
        <TextareaField<InvestigationDraftFormValues>
          name='cause'
          label='Cause (narrative)'
        />
        <TextareaField<InvestigationDraftFormValues>
          name='conclusion'
          label='Conclusion'
          rows={4}
        />
        <TextareaField<InvestigationDraftFormValues>
          name='recommendations'
          label='Recommendations'
          rows={4}
        />
        <Button type='submit' variant='outline' disabled={isPending}>
          {isPending ? <Spinner /> : "Save draft"}
        </Button>
      </form>
    </FormProvider>
  );
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className='space-y-0.5'>
    <p className='text-xs text-muted-foreground'>{label}</p>
    <p className='whitespace-pre-wrap text-sm'>{value || "—"}</p>
  </div>
);

const InvestigationView = ({ id }: { id: string }) => {
  const user = useUserStore((state) => state.user);
  const { investigation } = useGetInvestigation(id);
  const { submitReport, isPending: isSubmitting } = useSubmitReport();
  const { reviewReport, isPending: isReviewing } = useReviewReport();
  const [dialog, setDialog] = useState<"submit" | "approve" | "reject" | null>(
    null,
  );

  const status = investigation.report?.status;
  const isAssignee =
    user?.id === investigation.assignedInvestigatorId || isSuperAdmin(user);
  const isReviewer =
    (isChiefInvestigator(user) &&
      user?.officeId === investigation.conductingOfficeId) ||
    isSuperAdmin(user);
  const canEdit =
    isAssignee && !investigation.completedAt && (!status || EDITABLE.includes(status));
  const canReview = isReviewer && !!status && REVIEWABLE.includes(status);

  const review = (decision: "UNDER_REVIEW" | "APPROVED" | "REJECTED", remarks?: string) =>
    reviewReport({ id, decision, remarks })
      .then(() => setDialog(null))
      .catch(ignoreError);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {investigation.investigationNo}
          </h1>
          <p className='text-sm text-muted-foreground'>
            Case{" "}
            <Link
              to={`/cases/${investigation.case.id}`}
              className='underline-offset-4 hover:underline'
            >
              {investigation.case.caseNo}
            </Link>{" "}
            · {investigation.conductingOffice.name}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <ReportStatusBadge status={status} />
          {canEdit && investigation.report && (
            <Button onClick={() => setDialog("submit")} disabled={isSubmitting}>
              <Send className='size-4' />
              Submit report
            </Button>
          )}
          {canReview && status === "SUBMITTED" && (
            <Button
              variant='outline'
              disabled={isReviewing}
              onClick={() => review("UNDER_REVIEW")}
            >
              <Eye className='size-4' />
              Mark under review
            </Button>
          )}
          {canReview && (
            <>
              <Button onClick={() => setDialog("approve")}>
                <CheckCircle2 className='size-4' />
                Approve
              </Button>
              <Button variant='destructive' onClick={() => setDialog("reject")}>
                <XCircle className='size-4' />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Assignment</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 sm:grid-cols-3'>
          <Field label='Investigator' value={personName(investigation.assignedInvestigator)} />
          <Field label='Assigned by' value={personName(investigation.assignedBy)} />
          <Field label='Started' value={formatDateTime(investigation.startedAt)} />
          {investigation.completedAt && (
            <Field label='Completed' value={formatDateTime(investigation.completedAt)} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Investigation and report</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <DraftForm investigation={investigation} />
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              <Field
                label='Classification'
                value={investigation.classification && formatEnum(investigation.classification)}
              />
              <Field
                label='Cause of fire'
                value={investigation.causeOfFire && formatEnum(investigation.causeOfFire)}
              />
              <div className='sm:col-span-2 space-y-3'>
                <Field label='Origin of fire' value={investigation.originOfFire} />
                <Field label='Findings' value={investigation.report?.findings} />
                <Field label='Cause (narrative)' value={investigation.report?.cause} />
                <Field label='Conclusion' value={investigation.report?.conclusion} />
                <Field label='Recommendations' value={investigation.report?.recommendations} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AttachmentsCard
        title='Evidence'
        description={
          investigation.completedAt
            ? "The investigation is approved; its evidence is locked."
            : "Photos and documents gathered by the assigned investigator."
        }
        target={{ kind: "investigation", id: investigation.id }}
        canUpload={
          user?.id === investigation.assignedInvestigatorId &&
          !investigation.completedAt
        }
        allowRemoval={!investigation.completedAt}
      />

      {investigation.report && investigation.report.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Review history</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2'>
              {investigation.report.reviews.map((entry) => (
                <li key={entry.id} className='text-sm'>
                  <span className='font-medium'>{formatEnum(entry.decision)}</span>{" "}
                  <span className='text-muted-foreground'>
                    by {personName(entry.reviewer)} on {formatDateTime(entry.createdAt)}
                  </span>
                  {entry.remarks && (
                    <p className='text-muted-foreground'>“{entry.remarks}”</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <AlertDialogComponent
        open={dialog === "submit"}
        setOpen={(open) => !open && setDialog(null)}
        title='Submit the report?'
        description='The investigation is locked until the chief investigator reviews it. Save your draft first.'
        action={{
          label: "Submit",
          onClick: () => {
            submitReport(id).catch(ignoreError);
            setDialog(null);
          },
        }}
      />
      <AlertDialogComponent
        open={dialog === "approve"}
        setOpen={(open) => !open && setDialog(null)}
        title='Approve the report?'
        description='Approval completes the investigation and locks it.'
        action={{ label: "Approve", onClick: () => review("APPROVED") }}
      />
      <NoButtonDialogComponent
        open={dialog === "reject"}
        modalOnChange={(open) => !open && setDialog(null)}
        dialogTitle='Reject Report'
        dialogDescription='The investigator can edit and resubmit it.'
      >
        <ReasonForm
          label='Remarks'
          placeholder='What needs to change?'
          submitLabel='Reject report'
          destructive
          isPending={isReviewing}
          onSubmit={(remarks) => review("REJECTED", remarks)}
        />
      </NoButtonDialogComponent>
    </div>
  );
};

const InvestigationDetail = () => {
  const { id } = useParams();

  return (
    <div className='space-y-4'>
      <Link
        to='/investigations'
        className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Investigations
      </Link>
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<Skeleton className='h-96 w-full' />}>
          {id && <InvestigationView id={id} />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default InvestigationDetail;
