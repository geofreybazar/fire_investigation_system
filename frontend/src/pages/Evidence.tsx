import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Shield } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ErrorFallbackComponent from "@/components/common/ErrorFallbackComponent";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EvidenceTable from "@/components/features/attachments/EvidenceTable";

type Kind = "all" | "case" | "investigation";

const Evidence = () => {
  const [kind, setKind] = useState<Kind>("all");
  const [page, setPage] = useState(1);

  return (
    <div className='space-y-6'>
      <PageHeader
        icon={<Shield />}
        title='Evidence'
        description='Files attached to the cases and investigations you can see. Every download is recorded.'
      />

      <Tabs
        value={kind}
        onValueChange={(value) => {
          setKind(value as Kind);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value='all'>All files</TabsTrigger>
          <TabsTrigger value='investigation'>
            Investigation evidence
          </TabsTrigger>
          <TabsTrigger value='case'>Case documents</TabsTrigger>
        </TabsList>
      </Tabs>

      <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
        <Suspense fallback={<TableSkeleton />}>
          <EvidenceTable
            page={page}
            setPage={setPage}
            kind={kind === "all" ? undefined : kind}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default Evidence;
