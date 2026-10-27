import { useEffect, useRef, useState } from 'react';
import { searchOccBreakdownRows, type OccBreakdownItem, type OccResultRow } from '../lib/occBreakdown';
import { LABEL_CLASS } from './survey/tokens';
import { Req } from './survey/SectionCard';

interface OccupationBreakdownSelectProps {
  value: OccBreakdownItem | null;
  onChange: (item: OccBreakdownItem | null) => void;
  required?: boolean;
}

/**
 * Pencarian Breakdown Okupansi ASWATA (port `.search-wrap` / `searchOJK` +
 * `occ-dropdown` di prototipe HTML). Memilih item otomatis mengisi Kategori
 * Hazard Risk (skor 8 / 6 / 4) untuk langkah Occupancy.
 */
export function OccupationBreakdownSelect({ value, onChange, required }: OccupationBreakdownSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<OccResultRow[]>(() => searchOccBreakdownRows('', 30));
  const wrapRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar (setara listener document di prototipe).
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleQuery(v: string) {
    setQuery(v);
    setResults(searchOccBreakdownRows(v, 30));
    setOpen(true);
  }

  function pick(item: OccBreakdownItem) {
    onChange(item);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef}>
      <span className={LABEL_CLASS}>
        Breakdown Okupansi ASWATA
        {required && <Req />}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-survey-g3">🔍</span>
        <input
          type="text"
          className="w-full rounded-lg border-[1.5px] border-survey-g2 bg-white py-2.5 pl-9 pr-3 text-sm text-survey-dark outline-none transition-colors placeholder:text-survey-g3 focus:border-survey-blue"
          value={query}
          placeholder="Klik atau ketik kode / nama okupansi..."
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => handleQuery(e.target.value)}
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[220px] overflow-y-auto rounded-lg border-[1.5px] border-survey-blue bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
            {results.length === 0 ? (
              <div className="px-3 py-2 text-xs text-survey-g3">Tidak ada okupansi yang cocok.</div>
            ) : (
              results.map((row, index) =>
                row.kind === 'group' ? (
                  <div
                    key={`${row.code}-${index}`}
                    className="border-b border-survey-g2 bg-survey-g1 px-3 py-2 text-[11px] font-bold text-survey-navy"
                  >
                    {row.code} — {row.label}
                  </div>
                ) : (
                  <button
                    key={`${row.item.code}-${row.item.description.slice(0, 24)}-${index}`}
                    type="button"
                    onClick={() => pick(row.item)}
                    className="block w-full border-b-[0.5px] border-survey-g2 px-3 py-2 text-left transition-colors last:border-0 hover:bg-survey-llblue"
                  >
                    <span className="block text-[11px] font-bold text-survey-navy">{row.item.code}</span>
                    <span className="my-0.5 block text-survey-dark">{row.item.description}</span>
                    <span className="block text-[10px] text-survey-g3">{row.item.riskLabel}</span>
                  </button>
                ),
              )
            )}
          </div>
        )}
      </div>

      {value && (
        <div className="mt-2 rounded-lg bg-survey-lgreen px-3.5 py-2.5 text-xs text-survey-green">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-bold">{value.code}</span> — {value.description}
              <div className="mt-0.5 font-semibold">
                {value.riskLabel} — Skor {value.score} ({value.rating})
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="shrink-0 rounded-md px-1.5 text-sm font-bold text-survey-red hover:bg-white/60"
              title="Hapus pilihan"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <p className="mt-1 text-[11px] italic text-survey-g3">
        Pilih kode okupasi OJK/ASWATA agar Kategori Hazard Risk terisi otomatis.
      </p>
    </div>
  );
}
