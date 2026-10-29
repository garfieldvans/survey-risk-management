import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Survey, SurveyDraft } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { errorMessage, formatDate, formatDateTime } from '../lib/format';

/** Jumlah baris draft yang tampil sebelum tombol "Show more". */
const DRAFT_PREVIEW_COUNT = 5;

export function SurveyorSurveys() {
  const queryClient = useQueryClient();
  const [showAllDrafts, setShowAllDrafts] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState('');

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

  async function handleDeleteDraft(id: string) {
    if (!window.confirm('Hapus draft ini? Tindakan ini tidak bisa dibatalkan.')) return;
    setDeletingDraftId(id);
    setDraftError('');
    try {
      await api.delete(`/surveys/drafts/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['survey-drafts'] });
    } catch (err) {
      setDraftError(errorMessage(err));
    } finally {
      setDeletingDraftId(null);
    }
  }

  if (isLoading) return <Spinner />;

  const surveys = data ?? [];
  const draftList = drafts ?? [];
  const visibleDrafts = showAllDrafts ? draftList : draftList.slice(0, DRAFT_PREVIEW_COUNT);

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
            {visibleDrafts.map((d) => {
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
                  <div className="flex shrink-0 items-center gap-2">
                    <Link to={`/surveys/new?draft=${d.id}`} className="btn-primary">
                      Lanjutkan →
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDraft(d.id)}
                      disabled={deletingDraftId === d.id}
                      className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Hapus draft"
                    >
                      {deletingDraftId === d.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {draftError && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{draftError}</p>
          )}

          {draftList.length > DRAFT_PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllDrafts((v) => !v)}
              className="mt-2 text-sm font-medium text-brand-600 hover:underline"
            >
              {showAllDrafts
                ? 'Show less'
                : `Show more (${draftList.length - DRAFT_PREVIEW_COUNT} lagi)`}
            </button>
          )}
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