import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { SURVEY_STATUSES, type SurveyStatus } from '../shared';
import { api } from '../api/client';
import type { Survey } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { formatDate } from '../lib/format';

const STATUS_LABELS: Record<SurveyStatus, string> = {
  ONBOARD: 'On Board',
  REVIEW: 'Review',
  GRADING: 'Grading',
  DONE: 'Done',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

export function AdminSurveys() {
  const [params, setParams] = useSearchParams();
  const activeStatus = (params.get('status') ?? '') as SurveyStatus | '';

  const { data, isLoading } = useQuery({
    queryKey: ['surveys', activeStatus],
    queryFn: async () => {
      const res = await api.get('/surveys', {
        params: activeStatus ? { status: activeStatus } : {},
      });
      return res.data.data.surveys as Survey[];
    },
  });

  function setStatus(status: SurveyStatus | '') {
    if (status) setParams({ status });
    else setParams({});
  }

  return (
    <div>
      {/* Status filter chips */}
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <FilterChip active={!activeStatus} onClick={() => setStatus('')} label={`Semua (${data?.length ?? 0})`} />
        {SURVEY_STATUSES.map((s) => (
          <FilterChip
            key={s}
            active={activeStatus === s}
            onClick={() => setStatus(s)}
            label={`${STATUS_LABELS[s]} • ${data?.filter((x) => x.status === s).length ?? 0}`}
            status={s}
          />
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Okupasi</th>
                <th className="px-4 py-3">Surveyor</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data ?? []).map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.property.name}</div>
                    <div className="text-xs text-slate-400">{s.property.ownerName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.property.occupation?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.surveyor?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/surveys/${s.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  status,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  status?: SurveyStatus;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : status
            ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}