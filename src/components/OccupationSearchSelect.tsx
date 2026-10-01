import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Occupation } from '../api/types';
import { LABEL_CLASS } from './survey/tokens';

interface Props {
  /** occupationId terpilih; '' = belum dipilih. */
  value: string;
  onChange: (occupation: Occupation | null) => void;
  /** Mode surveyor: pemilihan wajib berakhir di node daun (tanpa anak). */
  requireLeaf?: boolean;
  placeholder?: string;
}

const MAX_RESULTS = 10;

/**
 * Pencarian Kode Okupansi OJK (port `.search-wrap` / `searchOJK()` di reff.html):
 * ketik ≥2 karakter → dropdown maks 10 hasil (cocokkan kode ATAU nama),
 * pilih → input terisi "KODE — Nama" + kotak hijau ✅ konfirmasi.
 * Berbeda dari reff (data statis), sumber data = tabel Occupation (GET /occupations).
 */
export function OccupationSearchSelect({ value, onChange, requireLeaf, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: all } = useQuery({
    queryKey: ['occupations'],
    queryFn: async () => {
      const res = await api.get('/occupations');
      return res.data.data.occupations as Occupation[];
    },
  });
  const occupations = all ?? [];

  const byId = useMemo(() => new Map(occupations.map((o) => [o.id, o])), [occupations]);
  const hasChildren = useMemo(() => new Set(occupations.map((o) => o.parentId).filter(Boolean) as string[]), [occupations]);

  const selected = value ? byId.get(value) ?? null : null;
  const selectedHasChildren = selected ? hasChildren.has(selected.id) : false;

  // Teks di input: hasil pencarian aktif, atau representasi pilihan tersimpan.
  const inputText = open ? query : selected ? `${selected.code} — ${selected.name}` : query;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return occupations
      .filter((o) => o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q))
      .sort((a, b) => a.code.localeCompare(b.code))
      .slice(0, MAX_RESULTS);
  }, [occupations, query]);

  // Tutup dropdown saat klik di luar (setara listener document reff.html).
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pick(node: Occupation) {
    onChange(node);
    setOpen(false);
    setQuery('');
  }

  return (
    <div>
      <label className={LABEL_CLASS}>
        Kode Okupansi OJK
        {requireLeaf && <span className="text-survey-red"> *</span>}
      </label>
      <div ref={wrapRef} className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-survey-g3">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-lg border-[1.5px] border-survey-g2 bg-white py-2.5 pl-9 pr-3 text-sm text-survey-dark outline-none transition-colors placeholder:text-survey-g3 focus:border-survey-blue"
          placeholder={placeholder ?? 'Ketik nama aktivitas / kode OJK...'}
          autoComplete="off"
          value={inputText}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        />

        {open && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-50 max-h-[200px] overflow-y-auto rounded-lg border-[1.5px] border-survey-blue bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
            {results.length === 0 ? (
              <div className="px-3 py-2 text-xs text-survey-g3">Tidak ada okupasi yang cocok.</div>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="block w-full border-b-[0.5px] border-survey-g2 px-3 py-2 text-left text-xs transition-colors last:border-0 hover:bg-survey-llblue"
                  onClick={() => pick(r)}
                >
                  <span className="block text-[11px] font-bold text-survey-navy">{r.code}</span>
                  <span className="my-0.5 block text-survey-dark">{r.name}</span>
                  <span className="block text-[10px] text-survey-g3">
                    Level {r.level}
                    {hasChildren.has(r.id) ? ' · grup, punya sub-kode' : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selected &&
        (selectedHasChildren ? (
          <div className="mt-2 rounded-lg bg-survey-lorng px-3.5 py-2.5 text-xs text-[#412402]">
            {requireLeaf
              ? `Okupasi "${selected.code} — ${selected.name}" masih punya sub-kode. Pilih sampai level terakhir (tanpa anak).`
              : `Okupasi terpilih: ${selected.code} — ${selected.name} — berlaku juga untuk semua turunannya.`}
          </div>
        ) : (
          <div className="mt-2 rounded-lg bg-survey-lgreen px-3.5 py-2.5 text-xs text-survey-green">
            ✅ <strong>Kode {selected.code}</strong> — {selected.name}
            <br />
            <small>Level {selected.level}</small>
          </div>
        ))}

      <p className="mt-1 text-[11px] italic text-survey-g3">Ketik nama aktivitas / kode untuk mencari okupasi OJK yang sesuai</p>
    </div>
  );
}
