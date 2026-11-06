import { Link } from "react-router";
import { Download, Shield } from "lucide-react";
import {
  useDownloadAttachment,
  useGetEvidence,
} from "@/hooks/attachments/useAttachments";
import type { EvidenceAttachment } from "@/interface/attachment/attachment";
import { formatDateTime } from "@/utils/dateTime";
import { formatFileSize } from "@/utils/formatFileSize";
import { personName } from "@/utils/formatEnum";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import PaginationComponent from "@/components/common/PaginationComponent";

interface EvidenceTableProps {
  page: number;
  setPage: (page: number) => void;
  kind?: "case" | "investigation";
}

// Where the file belongs, linked to its page.
const LinkedTo = ({ attachment }: { attachment: EvidenceAttachment }) =>
  attachment.investigation ? (
    <Link
      to={`/investigations/${attachment.investigation.id}`}
      className='underline-offset-4 hover:underline'
    >
      {attachment.investigation.investigationNo}
    </Link>
  ) : (
    <Link
      to={`/cases/${attachment.case.id}`}
      className='underline-offset-4 hover:underline'
    >
      {attachment.case.caseNo}
    </Link>
  );

const EvidenceTable = ({ page, setPage, kind }: EvidenceTableProps) => {
  const { evidence } = useGetEvidence(page, kind);
  const { download } = useDownloadAttachment();

  if (evidence.data.length === 0) {
    return (
      <EmptyState
        icon={<Shield />}
        title='No files yet'
        description='Files attached to cases and investigations you can see will appear here.'
      />
    );
  }

  const downloadButton = (attachment: EvidenceAttachment) => (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label={`Download ${attachment.originalName}`}
      onClick={() => download(attachment).catch(() => {})}
    >
      <Download />
    </Button>
  );

  return (
    <div className='flex flex-col rounded-lg border'>
      <div className='hidden overflow-x-auto md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Linked to</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-right'>Size</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidence.data.map((attachment) => (
              <TableRow key={attachment.id}>
                <TableCell>
                  <p className='font-medium'>{attachment.originalName}</p>
                  {attachment.description && (
                    <p className='text-sm text-muted-foreground'>
                      {attachment.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <LinkedTo attachment={attachment} />
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {personName(attachment.uploadedBy)}
                </TableCell>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {formatDateTime(attachment.createdAt)}
                </TableCell>
                <TableCell className='text-right tabular-nums text-muted-foreground'>
                  {formatFileSize(attachment.sizeBytes)}
                </TableCell>
                <TableCell>{downloadButton(attachment)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className='divide-y md:hidden'>
        {evidence.data.map((attachment) => (
          <li key={attachment.id} className='flex items-center gap-3 p-3'>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium'>{attachment.originalName}</p>
              <p className='text-sm'>
                <LinkedTo attachment={attachment} />
              </p>
              <p className='text-xs text-muted-foreground'>
                {formatFileSize(attachment.sizeBytes)} ·{" "}
                {formatDateTime(attachment.createdAt)}
              </p>
            </div>
            {downloadButton(attachment)}
          </li>
        ))}
      </ul>

      <div className='self-end'>
        <PaginationComponent
          totalPages={evidence.pagination.totalPages}
          currentPage={page}
          setCurrentPage={setPage}
        />
      </div>
    </div>
  );
};

export default EvidenceTable;
