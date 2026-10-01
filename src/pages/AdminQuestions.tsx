import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AnswerType, Occupation, Question } from '../api/types';
import { OccupationCascader } from '../components/OccupationCascader';
import { Spinner } from '../components/Spinner';
import { errorMessage } from '../lib/format';

const TYPE_BADGE: Record<AnswerType, string> = {
  TEXT: 'bg-slate-100 text-slate-600',
  YES_NO: 'bg-blue-100 text-blue-700',
  NUMBER: 'bg-emerald-100 text-emerald-700',
  CHOICE: 'bg-violet-100 text-violet-700',
  MULTI: 'bg-pink-100 text-pink-700',
};
const TYPE_LABEL: Record<AnswerType, string> = {
  TEXT: 'Teks',
  YES_NO: 'Ya/Tidak',
  NUMBER: 'Angka',
  CHOICE: 'Pilihan (1 opsi)',
  MULTI: 'Checkbox (banyak)',
};

type Filter = 'all' | 'core' | string; // string = occupationId

export function AdminQuestions() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Question | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['questions', 'admin'],
    queryFn: async () => {
      const res = await api.get('/questions');
      return res.data.data.questions as Question[];
    },
  });

  const { data: occData } = useQuery({
    queryKey: ['occupations'],
    queryFn: async () => {
      const res = await api.get('/occupations');
      return res.data.data.occupations as Occupation[];
    },
  });

  const questions = data ?? [];
  const occupations = occData ?? [];

  const grouped = useMemo(() => {
    let list = questions;
    if (filter === 'core') list = list.filter((q) => !q.occupationId);
    else if (filter !== 'all') {
      // Sertakan pertanyaan yang ditempel di okupasi turunan, supaya filter
      // "Transport and traffic" juga menampilkan pertanyaan yang ditempel
      // di node anak/cucunya (mis. 291 Construction firms).
      const descendantIds = new Set<string>();
      const queue: string[] = [];
      for (const o of occupations) {
        if (o.parentId === filter) {
          descendantIds.add(o.id);
          queue.push(o.id);
        }
      }
      while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const o of occupations) {
          if (o.parentId === cur && !descendantIds.has(o.id)) {
            descendantIds.add(o.id);
            queue.push(o.id);
          }
        }
      }
      list = list.filter((q) => q.occupationId === filter || descendantIds.has(q.occupationId ?? ''));
    }

    const bySection: Array<{ name: string; items: Question[] }> = [];
    for (const q of [...list].sort((a, b) => a.section.localeCompare(b.section) || a.order - b.order)) {
      const last = bySection[bySection.length - 1];
      if (last && last.name === q.section) last.items.push(q);
      else bySection.push({ name: q.section, items: [q] });
    }
    return bySection;
  }, [questions, filter, occupations]);

  function showError(err: unknown) {
    setError(errorMessage(err));
    setSuccess('');
    setTimeout(() => setError(''), 4000);
  }
  function showSuccess(msg: string) {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 4000);
  }

  const deleteMutation = useMutation({
    mutationFn: async (q: Question) => {
      await api.delete(`/questions/${q.id}`);
    },
    onSuccess: (_d, q) => {
      showSuccess(`Pertanyaan "${q.text}" dihapus`);
      queryClient.invalidateQueries({ queryKey: ['questions', 'admin'] });
    },
    onError: (err) => showError(err),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{success}</div>}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="Semua" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Core" active={filter === 'core'} onClick={() => setFilter('core')} />
          <select
            className="input max-w-xs"
            value={filter === 'all' || filter === 'core' ? '' : filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Per Okupasi...</option>
            {occupations.map((o) => (
              <option key={o.id} value={o.id}>{o.code} — {o.name} (L{o.level})</option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setEditing(null); setFormOpen((v) => !v); }}>
          {formOpen ? 'Tutup Form' : '+ Tambah Pertanyaan'}
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <QuestionForm
          key={editing?.id ?? 'new'}
          editing={editing}
          questions={questions}
          onCancel={() => setFormOpen(false)}
          onError={showError}
          onSuccess={(msg) => {
            showSuccess(msg);
            setEditing(null);
            setFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['questions', 'admin'] });
          }}
        />
      )}

      {/* List by section */}
      {grouped.length === 0 && (
        <div className="card py-16 text-center text-sm text-slate-400">
          Belum ada pertanyaan. Tambahkan pertanyaan pertama, atau ubah filter.
        </div>
      )}
      {grouped.map((section) => (
        <div key={section.name} className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{section.name}</h3>
          <div className="space-y-2">
            {section.items.map((q) => (
              <div key={q.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800">
                    {q.required && <span className="mr-1 text-red-500">*</span>}
                    {q.text}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <span className={`rounded px-1.5 py-0.5 font-medium ${TYPE_BADGE[q.answerType]}`}>
                      {TYPE_LABEL[q.answerType]}
                    </span>
                    {q.options?.length > 0 && <span>{q.options.length} opsi</span>}
                    <span>urutan {q.order}</span>
                    {q.occupation ? (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700">
                        {q.occupation.code} — {q.occupation.name} (L{q.occupation.level})
                      </span>
                    ) : (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-500">Core</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="btn-secondary !px-2 !py-1 !text-xs"
                    onClick={() => { setEditing(q); setFormOpen(true); }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-danger !px-2 !py-1 !text-xs"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Hapus pertanyaan "${q.text}"?`)) deleteMutation.mutate(q);
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

function QuestionForm({
  editing,
  questions,
  onCancel,
  onError,
  onSuccess,
}: {
  editing: Question | null;
  questions: Question[];
  onCancel: () => void;
  onError: (err: unknown) => void;
  onSuccess: (msg: string) => void;
}) {
  const [text, setText] = useState(editing?.text ?? '');
  const [answerType, setAnswerType] = useState<AnswerType>(editing?.answerType ?? 'TEXT');
  const [optionsText, setOptionsText] = useState((editing?.options ?? []).join('\n'));
  const [section, setSection] = useState(editing?.section ?? '');
  const [order, setOrder] = useState(editing?.order ?? 1);
  const [required, setRequired] = useState(editing?.required ?? false);
  const [occupationId, setOccupationId] = useState(editing?.occupationId ?? '');
  const [useOpen, setUseOpen] = useState(false);

  const existingSections = questions.map((q) => q.section);

  function useExisting(q: Question) {
    setText(q.text);
    setAnswerType(q.answerType);
    setOptionsText((q.options ?? []).join('\n'));
    setSection(q.section);
    setOrder(Math.max(0, ...questions.filter((x) => x.section === q.section).map((x) => x.order)) + 1);
    setRequired(q.required);
    setOccupationId(q.occupationId ?? '');
    setUseOpen(false);
  }

  const needsOptions = answerType === 'CHOICE' || answerType === 'MULTI';
  const parsedOptions = optionsText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        text,
        answerType,
        section,
        order: Number(order),
        required,
        ...(needsOptions ? { options: parsedOptions } : { options: [] }),
        ...(occupationId ? { occupationId } : {}),
      };
      if (editing) {
        await api.patch(`/questions/${editing.id}`, payload);
      } else {
        await api.post('/questions', payload);
      }
    },
    onSuccess: () => onSuccess(editing ? 'Pertanyaan diperbarui' : 'Pertanyaan ditambahkan'),
    onError: (err) => onError(err),
  });

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {editing ? `Edit Pertanyaan #${editing.order}` : 'Tambah Pertanyaan Baru'}
        </h3>
        {!editing && (
          <button type="button" className="btn-secondary !py-1.5 !text-xs" onClick={() => setUseOpen(true)}>
            ⧉ Use Existing
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">Pertanyaan</label>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Teks pertanyaan untuk surveyor..." />
        </div>
        <div>
          <label className="label">Tipe Jawaban</label>
          <select className="input" value={answerType} onChange={(e) => setAnswerType(e.target.value as AnswerType)}>
            <option value="TEXT">Teks</option>
            <option value="YES_NO">Ya/Tidak</option>
            <option value="NUMBER">Angka</option>
            <option value="CHOICE">Pilihan (1 opsi)</option>
            <option value="MULTI">Checkbox (banyak)</option>
          </select>
        </div>
        {needsOptions && (
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Opsi Jawaban (satu per baris)</label>
            <textarea
              className="input resize-y"
              rows={4}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={answerType === 'CHOICE' ? 'cth.\nRendah\nSedang\nTinggi' : 'cth.\nKebakaran\nBanjir\nPencurian'}
            />
            <p className="mt-1 text-xs text-slate-400">
              {parsedOptions.length} opsi — wajib minimal 1 untuk tipe ini.
            </p>
          </div>
        )}
        <div>
          <label className="label">Bagian (Section)</label>
          <input className="input" list="question-sections" value={section} onChange={(e) => setSection(e.target.value)} placeholder="cth. Data Umum" />
          <datalist id="question-sections">
            {[...new Set(existingSections)].map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label className="label">Urutan (order)</label>
          <input className="input" type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">Okupasi (biarkan "Core — semua okupasi" untuk semua tingkat)</label>
          <OccupationCascader value={occupationId} onChange={(o) => setOccupationId(o?.id ?? '')} allowCore />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Wajib diisi surveyor
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
        <button
          type="button"
          className="btn-primary"
          disabled={mutation.isPending || !text.trim() || !section.trim() || (needsOptions && parsedOptions.length === 0)}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : '+ Tambah'}
        </button>
      </div>

      {useOpen && (
        <ExistingQuestionModal
          questions={questions}
          excludeId={editing?.id}
          onClose={() => setUseOpen(false)}
          onUse={useExisting}
        />
      )}
    </div>
  );
}

function ExistingQuestionModal({
  questions,
  excludeId,
  onClose,
  onUse,
}: {
  questions: Question[];
  excludeId?: string;
  onClose: () => void;
  onUse: (q: Question) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const qLower = search.trim().toLowerCase();
  const list = questions
    .filter((q) => q.id !== excludeId)
    .filter((q) =>
      !qLower
        ? true
        : q.text.toLowerCase().includes(qLower) ||
          q.section.toLowerCase().includes(qLower) ||
          (q.occupation ? `${q.occupation.code} ${q.occupation.name}`.toLowerCase().includes(qLower) : false),
    )
    .sort((a, b) => a.section.localeCompare(b.section) || a.order - b.order);

  const selected = questions.find((q) => q.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Gunakan Pertanyaan Existing sebagai Template</h3>
          <button type="button" className="text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <input
            className="input"
            placeholder="Cari teks / bagian / okupasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {list.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">Tidak ada pertanyaan yang cocok.</div>
          )}
          <div className="space-y-1.5">
            {list.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedId(q.id)}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === q.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${selectedId === q.id ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{q.text}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                    {TYPE_LABEL[q.answerType]} · {q.section} · urutan {q.order}
                    {q.occupation ? ` · ${q.occupation.code}` : ' · Core'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selected}
            onClick={() => selected && onUse(selected)}
          >
            Gunakan
          </button>
        </div>
      </div>
    </div>
  );
}