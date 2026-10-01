import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { SURVEY_ITEMS, SCORE_MIN, bandLabelOfScore, categoryOfScore, labelOfCategory, type GradeCategory } from '../shared';
import { api } from '../api/client';
import type { Survey, SurveyAnswer } from '../api/types';
import { ScoreSelector } from '../components/ScoreSelector';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { SurveyExtraDataCards } from '../components/SurveyExtraDataCards';
import { errorMessage, formatBytes } from '../lib/format';

const CATEGORY_BADGE: Record<GradeCategory, string> = {
  POOR: 'bg-red-100 text-red-700',
  MARGINAL: 'bg-amber-100 text-amber-700',
  AVERAGE: 'bg-blue-100 text-blue-700',
  GOOD: 'bg-emerald-100 text-emerald-700',
};

export function AdminSurveyReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gradeNotes, setGradeNotes] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      const res = await api.get(`/surveys/${id}`);
      return res.data.data.survey as Survey;
    },
    enabled: !!id,
  });

  const answerSections = useMemo(() => groupAnswersBySection(data?.answers ?? []), [data]);
  const surveyorResponses = [...(data?.responses ?? [])].sort(
    (a, b) => (a.item?.order ?? 0) - (b.item?.order ?? 0),
  );
  const surveyorTotal = surveyorResponses.reduce((sum, r) => sum + r.score, 0);

  // Grading starts fresh — no surveyor scores to seed. Default SCORE_MIN (1).
  const currentScores = scores;
  const total = SURVEY_ITEMS.reduce((sum, item) => sum + (currentScores[item.code] ?? SCORE_MIN), 0);
  const suggestedCategory = categoryOfScore(total);

  if (isLoading) return <Spinner />;
  if (!data) return <div className="card">Survei tidak ditemukan.</div>;

  const { property, answers, attachments, status, grade } = data;
  const hasWizardData = property.extraData && Object.keys(property.extraData).length > 0;

  async function transition(to: string) {
    setBusy(to);
    setError('');
    try {
      await api.patch(`/surveys/${id}/status`, { status: to });
      await queryClient.invalidateQueries({ queryKey: ['survey', id] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['surveys'] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function submitGrade() {
    setBusy('grade');
    setError('');
    if (status !== 'GRADING') {
      setError('Survei harus dalam status GRADING dulu sebelum diberi grade');
      setBusy(null);
      return;
    }
    try {
      await api.post(`/surveys/${id}/grade`, {
        items: SURVEY_ITEMS.map((item) => ({ itemCode: item.code, score: currentScores[item.code] ?? SCORE_MIN })),
        notes: gradeNotes || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['survey', id] });
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['surveys'] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const statusOrder = ['ONBOARD', 'REVIEW', 'GRADING', 'DONE'];

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{property.name}</h2>
          <p className="text-sm text-slate-500">{property.address}</p>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>Okupasi: <strong className="text-slate-700">{property.occupation?.code} — {property.occupation?.name}</strong></span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Data wizard surveyor (extraData) — base data dari survey */}
      {hasWizardData && <SurveyExtraDataCards extra={property.extraData} />}

      {/* Hasil grading mandiri surveyor — acuan awal untuk penilaian admin */}
      {surveyorResponses.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Hasil Grading Surveyor (Penilaian Awal)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Aspek</th>
                  <th className="py-2 pr-3 text-right font-semibold">Skor</th>
                  <th className="py-2 pr-3 font-semibold">Rating</th>
                  <th className="py-2 font-semibold">Catatan Surveyor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveyorResponses.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 font-medium text-slate-700">{r.item?.name ?? r.itemId}</td>
                    <td className="py-2 pr-3 text-right font-bold text-slate-800">{r.score}</td>
                    <td className="py-2 pr-3 text-xs font-semibold text-slate-600">{bandLabelOfScore(r.score)}</td>
                    <td className="py-2 whitespace-pre-wrap text-slate-600">{r.notes || <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td className="py-2 pr-3 font-semibold text-slate-700">Total (dari 55)</td>
                  <td className="py-2 pr-3 text-right text-base font-bold text-slate-800">{surveyorTotal}</td>
                  <td className="py-2 pr-3" colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Skala: 46–55 Good · 31–45 Average · 21–30 Marginal · ≤20 Poor — skor surveyor dihitung otomatis dari input wizard.
          </div>
        </div>
      )}

      {/* Surveyor answers by section */}
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Jawaban Surveyor {answers && answers.length > 0 ? `(${answers.length})` : ''}
        </h3>
        {answerSections.length === 0 ? (
          <div className="text-sm text-slate-400">Belum ada jawaban kuesioner.</div>
        ) : (
          <div className="space-y-4">
            {answerSections.map((section) => (
              <div key={section.name}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">{section.name}</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {section.items.map((a) => (
                    <div key={a.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="font-medium text-slate-700">{a.question.text}</div>
                      <div className="mt-0.5 text-slate-800">{formatAnswerValue(a)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Lampiran ({attachments.length})</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {attachments.map((att) => (
              <a
                key={att.id}
                href={att.downloadUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-200 p-3 text-sm transition-colors hover:border-brand-500"
              >
                <div className="truncate font-medium text-slate-700">{att.fileName}</div>
                <div className="mt-1 text-xs text-slate-400">{att.kind} · {formatBytes(att.sizeBytes)}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Grade form */}
      <div className="card">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Penilaian Grade</h3>
        <p className="mb-4 text-xs text-slate-400">
          Beri skor tiap item risiko berdasarkan jawaban surveyor di atas. Total & kategori dihitung otomatis oleh sistem.
        </p>

        {SURVEY_ITEMS.map((item) => (
          <ScoreSelector
            key={item.code}
            label={item.name}
            value={currentScores[item.code] ?? SCORE_MIN}
            onChange={(score) => setScores((prev) => ({ ...prev, [item.code]: score }))}
          />
        ))}

        {/* Total summary */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
          <div>
            <div className="text-xs text-slate-400">Total Skor</div>
            <div className="text-3xl font-bold text-slate-800">{total}</div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-400">Kategori (otomatis)</div>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${CATEGORY_BADGE[suggestedCategory]}`}>
              {labelOfCategory(suggestedCategory)}
            </span>
          </div>
          <div className="ml-auto text-xs text-slate-400">
            ≤20 Poor · ≤30 Marginal · ≤45 Average · ≤64 Good
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Catatan Penilaian</label>
          <textarea
            className="input resize-y"
            rows={2}
            value={gradeNotes}
            onChange={(e) => setGradeNotes(e.target.value)}
            placeholder="Alasan / catatan untuk grade ini..."
            disabled={!!grade}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {grade ? (
            <span className="text-sm text-emerald-600 font-medium">
              Sudah dinilai: {grade.totalScore} · {labelOfCategory(grade.category)}
            </span>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={submitGrade}
              disabled={busy !== null || status !== 'GRADING'}
              title={status !== 'GRADING' ? 'Pindahkan status ke GRADING terlebih dahulu' : ''}
            >
              {busy === 'grade' ? 'Menyimpan...' : 'Submit Grade → DONE'}
            </button>
          )}
        </div>
      </div>

      {/* Status transition */}
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Transisi Status</h3>
        <div className="mb-3 flex items-center gap-1 text-xs">
          {statusOrder.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${s === status ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {s}
              </span>
              {i < statusOrder.length - 1 && <span className="text-slate-300">→</span>}
            </span>
          ))}
          <span className="ml-2">(status saat ini: <strong>{status}</strong>)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === 'ONBOARD' && (
            <button type="button" className="btn-primary" onClick={() => transition('REVIEW')} disabled={busy !== null}>
              {busy === 'REVIEW' ? 'Memproses...' : 'Terima → Review'}
            </button>
          )}
          {status === 'REVIEW' && (
            <>
              <button type="button" className="btn-primary" onClick={() => transition('GRADING')} disabled={busy !== null}>
                {busy === 'GRADING' ? 'Memproses...' : 'Lanjut → Grading'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => transition('CLOSED')} disabled={busy !== null}>
                Tutup (Closed)
              </button>
              <button type="button" className="btn-danger" onClick={() => transition('REJECTED')} disabled={busy !== null}>
                Tolak (Rejected)
              </button>
            </>
          )}
          {status === 'GRADING' && (
            <>
              <button type="button" className="btn-secondary" onClick={() => transition('CLOSED')} disabled={busy !== null}>
                Tutup (Closed)
              </button>
              <button type="button" className="btn-danger" onClick={() => transition('REJECTED')} disabled={busy !== null}>
                Tolak (Rejected)
              </button>
            </>
          )}
        </div>
      </div>

      <button type="button" onClick={() => navigate('/admin/surveys')} className="btn-secondary">
        ← Kembali ke daftar
      </button>
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