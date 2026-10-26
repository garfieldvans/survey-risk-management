import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Survey, SurveyDraft } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { formatDate, formatDateTime } from '../lib/format';

export function SurveyorSurveys() {
  const { data, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await api.get('/surveys');
      return res.data.data.surveys as Survey[];
    },
  });

  // Draft yang belum dikirim — dihapus otomatis 30 hari sejak simpan terakhir
  // (sudah difilter & dibersihkan server saat daftar ini diminta).
  const { data: drafts } = useQuery({
    queryKey: ['survey-drafts'],
    queryFn: async () => {
      const res = await api.get('/surveys/drafts');
      return res.data.data.drafts as SurveyDraft[];
    },
  });

  if (isLoading) return <Spinner />;

  const surveys = data ?? [];
  const draftList = drafts ?? [];

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 pb-16 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{surveys.length} survei</p>
        <Link to="/surveys/new" className="btn-primary">+ Buat Survei Baru</Link>
      </div>

      {draftList.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">
              📝 Draft belum dikirim <span className="font-normal text-slate-400">({draftList.length})</span>
            </p>
            <p className="text-xs text-slate-400">Draft dihapus otomatis 30 hari setelah terakhir disimpan</p>
          </div>
          <div className="space-y-2">
            {draftList.map((d) => {
              const info = d.data?.info ?? {};
              const name = info.tertanggung?.trim() || '(nama tertanggung belum diisi)';
              const done = d.data?.progress?.done ?? 0;
              const total = d.data?.progress?.total ?? 11;
              const sisaHari = Math.max(
                0,
                Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / 86_400_000),
              );
              return (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Draft
                      </span>
                      <span className="truncate text-sm font-medium text-slate-800">{name}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {info.kota ? `${info.kota} · ` : ''}
                      {done}/{total} langkah terisi · Disimpan {formatDateTime(d.updatedAt)}
                      {sisaHari <= 7 ? (
                        <span className="ml-1 font-semibold text-amber-600">· sisa {sisaHari} hari</span>
                      ) : (
                        <span className="ml-1 text-slate-400">· sisa {sisaHari} hari</span>
                      )}
                    </div>
                  </div>
                  <Link to={`/surveys/new?draft=${d.id}`} className="btn-primary shrink-0">
                    Lanjutkan →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

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