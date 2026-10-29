import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Survey } from '../api/types';
import { Spinner } from '../components/Spinner';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../lib/format';
import { labelOfCategory } from '../shared';

const REPORT_STATUSES = ['APPROVED', 'REJECTED'] as const;

export function AdminReports() {
  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await api.get('/surveys');
      return res.data.data.surveys as Survey[];
    },
  });

  if (isLoading) return <Spinner />;

  // List reports: hanya survey berstatus APPROVED dan REJECTED.
  const rows = (surveys ?? []).filter((s) =>
    (REPORT_STATUSES as readonly string[]).includes(s.status),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Laporan Survey</h2>
        <p className="text-sm text-slate-500">{rows.length} laporan</p>
      </div>

      {rows.length === 0 ? (
        <div className="card py-16 text-center text-sm text-slate-400">
          Belum ada laporan dengan status Approved atau Rejected.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Okupasi</th>
                <th className="px-4 py-3">Surveyor</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Grading</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.property.name}</div>
                    <div className="text-xs text-slate-400">{s.property.ownerName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.property.occupation?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.surveyor?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s.surveyDate ?? s.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {s.grade ? `${s.grade.totalScore} · ${labelOfCategory(s.grade.category)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/reports/${s.id}`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Detail
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
