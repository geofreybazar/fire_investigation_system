import { Suspense } from "react";
import { Link, useParams } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { ArrowLeft } from "lucide-react";
import useGetCase from "@/hooks/cases/useGetCase";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import CaseSummary from "@/components/features/cases/detail/CaseSummary";
import CaseActions from "@/components/features/cases/detail/CaseActions";
import CaseImpactCard from "@/components/features/cases/detail/CaseImpactCard";
import InvestigationCaseSection from "@/components/features/cases/detail/InvestigationCaseSection";
import AttachmentsCard from "@/components/features/attachments/AttachmentsCard";
import { useUserStore } from "@/store/userStore";
import {
  isChiefInvestigator,
  isSuperAdmin,
} from "@/utils/casePermissions";

const Detail = ({ id }: { id: string }) => {
  const user = useUserStore((state) => state.user);
  const { investigationCase } = useGetCase(id);
  const { location } = investigationCase;

  // The creator or the handling office's chief adds case documents.
  const canAttach =
    isSuperAdmin(user) ||
    (isChiefInvestigator(user) &&
      (user?.officeId === investigationCase.handlingOfficeId ||
        user?.id === investigationCase.createdById));

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {investigationCase.caseNo}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {location
              ? `${location.barangay}, ${location.city_municipality}`
              : investigationCase.station.name}
          </p>
        </div>
        <CaseActions investigationCase={investigationCase} />
      </div>

      <CaseSummary investigationCase={investigationCase} />
      <InvestigationCaseSection investigationCase={investigationCase} />
      <CaseImpactCard investigationCase={investigationCase} />
      <AttachmentsCard
        title='Case documents'
        description='Documents about the case. Investigation evidence is kept on each investigation.'
        target={{ kind: "case", id: investigationCase.id }}
        canUpload={canAttach}
        allowRemoval={canAttach}
      />
    </div>
  );
};

const CaseDetail = () => {
  const { id } = useParams();

  return (
    <div className='space-y-4'>
      <Link
        to='/cases'
        className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Investigation cases
      </Link>
      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<Skeleton className='h-96 w-full' />}>
          {id && <Detail id={id} />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default CaseDetail;
