import type { SurveyStatus } from '../shared';

const STATUS_STYLES: Record<SurveyStatus, string> = {
  ONBOARD: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  REQUEST_REVISE: 'bg-orange-100 text-orange-700',
  REVISED: 'bg-cyan-100 text-cyan-700',
  REJECTED: 'bg-red-100 text-red-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<SurveyStatus, string> = {
  ONBOARD: 'On Board',
  REVIEW: 'Under Review',
  REQUEST_REVISE: 'Request Revisi',
  REVISED: 'Revised',
  REJECTED: 'Rejected',
  APPROVED: 'Approved',
};

export function StatusBadge({ status }: { status: SurveyStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}