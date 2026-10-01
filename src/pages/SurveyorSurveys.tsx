import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Survey } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { formatDate } from '../lib/format';

export function SurveyorSurveys() {
  const { data, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await api.get('/surveys');
      return res.data.data.surveys as Survey[];
    },
  });

  if (isLoading) return <Spinner />;

  const surveys = data ?? [];

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 pb-16 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{surveys.length} survei</p>
        <Link to="/surveys/new" className="btn-primary">+ Buat Survei Baru</Link>
      </div>

      {surveys.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-sm text-slate-400">Belum ada survei. Mulai buat survei pertama kamu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Okupasi</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveys.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.property.name}</div>
                    <div className="text-xs text-slate-400">{s.property.address}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.property.occupation?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s.surveyDate ?? s.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/surveys/${s.id}`} className="text-xs font-medium text-brand-600 hover:underline">
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