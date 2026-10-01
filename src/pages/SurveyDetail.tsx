import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { bandLabelOfScore, labelOfCategory } from '../shared';
import { api } from '../api/client';
import type { Survey, SurveyAnswer } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { SurveyExtraDataCards } from '../components/SurveyExtraDataCards';
import { useAuth } from '../hooks/useAuth';
import { formatBytes, formatDateTime } from '../lib/format';

const CATEGORY_BADGE: Record<string, string> = {
  POOR: 'bg-red-100 text-red-700',
  MARGINAL: 'bg-amber-100 text-amber-700',
  AVERAGE: 'bg-blue-100 text-blue-700',
  GOOD: 'bg-emerald-100 text-emerald-700',
};

export function SurveyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      const res = await api.get(`/surveys/${id}`);
      return res.data.data.survey as Survey;
    },
    enabled: !!id,
  });

  const answerSections = useMemo(() => groupAnswersBySection(data?.answers ?? []), [data]);

  if (isLoading) return <Spinner />;
  if (!data) return <div className="card">Survei tidak ditemukan.</div>;

  const { property, answers, attachments, grade, notes } = data;
  const surveyorResponses = [...(data.responses ?? [])].sort(
    (a, b) => (a.item?.order ?? 0) - (b.item?.order ?? 0),
  );
  const surveyorTotal = surveyorResponses.reduce((sum, r) => sum + r.score, 0);

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 pb-16 sm:px-6">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{property.name}</h2>
          <p className="text-sm text-slate-500">{property.address}</p>
        </div>
        <StatusBadge status={data.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Occupation */}
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Okupasi</h3>
            {property.occupation ? (
              <div className="text-lg font-semibold text-slate-800">
                {property.occupation.code} — {property.occupation.name}
              </div>
            ) : (
              <div className="text-sm text-slate-400">Okupasi tidak ditemukan</div>
            )}
          </div>

          {/* Wizard data — info umum, survey umum, khusus okupansi, loss history */}
          <SurveyExtraDataCards extra={property.extraData} />

          {/* Surveyor answers by section */}
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Jawaban Surveyor {answers && answers.length > 0 && `(${answers.length})`}
            </h3>
            {answerSections.length === 0 ? (
              <div className="text-sm text-slate-400">Belum ada jawaban kuesioner.</div>
            ) : (
              <div className="space-y-4">
                {answerSections.map((section) => (
                  <div key={section.name}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">{section.name}</h4>
                    <dl className="space-y-1.5">
                      {section.items.map((a) => (
                        <div key={a.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <dt className="font-medium text-slate-700">{a.question.text}</dt>
                          <dd className="mt-0.5 text-slate-800">{formatAnswerValue(a)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
            </div>

          {/* Hasil grading mandiri surveyor (dari wizard, 8 aspek — port score-tbl reff.html) */}
          {surveyorResponses.length > 0 && (
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Hasil Grading Surveyor
                {grade && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    penilaian awal — grade resmi oleh admin di bawah
                  </span>
                )}
              </h3>
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Aspek</th>
                    <th className="py-2 pr-3 text-right font-semibold">Skor</th>
                    <th className="py-2 font-semibold">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {surveyorResponses.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 font-medium text-slate-700">{r.item?.name ?? r.itemId}</td>
                      <td className="py-2 pr-3 text-right font-bold text-slate-800">{r.score}</td>
                      <td className="py-2 text-xs font-semibold" style={{ color: bandColorOfScore(r.score) }}>
                        {bandLabelOfScore(r.score)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200">
                    <td className="py-2 pr-3 font-semibold text-slate-700">Total (dari 55)</td>
                    <td className="py-2 pr-3 text-right text-base font-bold text-slate-800">{surveyorTotal}</td>
                    <td className="py-2" />
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                Skala: 46–55 Good · 31–45 Average · 21–30 Marginal · ≤20 Poor
              </div>
              {surveyorResponses.some((r) => r.notes) && (
                <div className="mt-3 space-y-1.5">
                  {surveyorResponses
                    .filter((r) => r.notes)
                    .map((r) => (
                      <p key={r.id} className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">{r.item?.name ?? r.itemId}:</span> {r.notes}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="card">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Catatan Surveyor</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{notes}</p>
            </div>
          )}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Lampiran ({attachments.length})</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.downloadUrl ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:border-brand-500"
                  >
                    <div className="truncate text-sm font-medium text-slate-700">{att.fileName}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {att.kind} · {formatBytes(att.sizeBytes)}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: metadata */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Informasi</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Pemilik</dt>
                <dd className="font-medium text-slate-800">{property.ownerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Surveyor</dt>
                <dd className="font-medium text-slate-800">{data.surveyor?.name ?? '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tanggal Survei</dt>
                <dd className="font-medium text-slate-800">{formatDateTime(data.surveyDate ?? data.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Dibuat</dt>
                <dd className="font-medium text-slate-800">{formatDateTime(data.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {grade && (
            <div className="card border-l-4" style={{ borderLeftColor: gradeColor(grade.category) }}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Risk Grade</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800">{grade.totalScore}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[grade.category] ?? 'bg-slate-100 text-slate-700'}`}>
                  {labelOfCategory(grade.category)}
                </span>
              </div>
              {grade.notes && <p className="mt-2 text-sm whitespace-pre-wrap text-slate-600">{grade.notes}</p>}
              <p className="mt-2 text-xs text-slate-400">
                Dinilai oleh {grade.admin?.name ?? '-'} · {formatDateTime(grade.gradedAt)}
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="card">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Aksi Admin</h3>
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => navigate(`/admin/surveys/${id}/review`)}
              >
                Review & Nilai
              </button>
              <button
                type="button"
                className="btn-secondary mt-2 w-full"
                onClick={() => navigate(`/admin/reports?surveyId=${id}`)}
              >
                Lihat Laporan
              </button>
            </div>
          )}
        </div>
      </div>

      <button type="button" onClick={() => navigate(isAdmin ? '/admin/surveys' : '/surveys')} className="btn-secondary">
        ← Kembali
      </button>
      </div>
    </div>
  );
}

function groupAnswersBySection(answers: SurveyAnswer[]) {
  const items = [...answers].sort((a, b) => a.question.order - b.question.order);
  const out: Array<{ name: string; items: SurveyAnswer[] }> = [];
  for (const a of items) {
    const last = out[out.length - 1];
    if (last && last.name === a.question.section) last.items.push(a);
    else out.push({ name: a.question.section, items: [a] });
  }
  return out;
}

function formatAnswerValue(a: SurveyAnswer): string {
  if (a.question.answerType === 'NUMBER') return Number(a.value).toLocaleString('id-ID');
  return a.value;
}

function gradeColor(category: string): string {
  switch (category) {
    case 'POOR':
      return '#b91c1c';
    case 'MARGINAL':
      return '#b45309';
    case 'AVERAGE':
      return '#1d4ed8';
    default:
      return '#047857';
  }
}

/** Warna band rating per item skor (setara `.score-*` reff.html). */
function bandColorOfScore(score: number): string {
  if (score >= 6) return '#2e844a'; // green
  if (score >= 4) return '#e07b00'; // orange
  if (score >= 3) return '#ba0517'; // red
  return '#5a31aa'; // purple
}