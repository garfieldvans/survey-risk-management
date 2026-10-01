import type { SurveyStatus } from '../shared';

const STATUS_STYLES: Record<SurveyStatus, string> = {
  ONBOARD: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  GRADING: 'bg-purple-100 text-purple-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-600',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<SurveyStatus, string> = {
  ONBOARD: 'On Board',
  REVIEW: 'Review',
  GRADING: 'Grading',
  DONE: 'Done',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

export function StatusBadge({ status }: { status: SurveyStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}