import { Badge } from "@/components/ui/badge";
import { formatEnum } from "@/utils/formatEnum";
import {
  CASE_STATE_TONE,
  REPORT_TONE,
  TONE_CLASS,
  type Tone,
} from "@/utils/statusTone";
import type { CaseState, ReportStatus } from "@/constants/investigation";

const ToneBadge = ({ tone, label }: { tone: Tone; label: string }) => (
  <Badge variant='outline' className={TONE_CLASS[tone]}>
    {label}
  </Badge>
);

const STATE_LABEL: Record<CaseState, string> = {
  OPEN: "Investigation open",
  CLOSED: "No open investigation",
};

export const CaseStateBadge = ({ state }: { state: CaseState }) => (
  <ToneBadge tone={CASE_STATE_TONE[state]} label={STATE_LABEL[state]} />
);

export const ReportStatusBadge = ({
  status,
}: {
  status?: ReportStatus | null;
}) =>
  status ? (
    <ToneBadge tone={REPORT_TONE[status]} label={formatEnum(status)} />
  ) : (
    <ToneBadge tone='neutral' label='No report yet' />
  );
