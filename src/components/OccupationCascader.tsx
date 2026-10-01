import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Occupation } from '../api/types';
import { FIELD_CLASS, LABEL_CLASS } from './survey/tokens';

interface Props {
  value: string; // occupationId; '' = belum dipilih / Core
  onChange: (occupation: Occupation | null) => void;
  /** Mode surveyor: pemilihan wajib berakhir di node daun (tanpa anak). */
  requireLeaf?: boolean;
  /** Mode admin: tampilkan pilihan "Core — semua okupasi" (nilai ''). */
  allowCore?: boolean;
}

/**
 * Pilih okupasi berjenjang sesuai pohon OJK (parentId-driven, kedalaman adaptif):
 * select L1 → jika punya anak, muncul select level berikutnya → berhenti di node daun.
 * Warna mengikuti token reff.html: kotak terpilih hijau (`--lgreen`), peringatan oranye.
 */
export function OccupationCascader({ value, onChange, requireLeaf, allowCore }: Props) {
  const { data: all } = useQuery({
    queryKey: ['occupations'],
    queryFn: async () => {
      const res = await api.get('/occupations');
      return res.data.data.occupations as Occupation[];
    },
  });

  const occupations = all ?? [];

  const { byId, childrenOf, roots } = useMemo(() => {
    const byId = new Map<string, Occupation>();
    // childrenOfMap: parentId -> occupations
    const cMap = new Map<string, Occupation[]>();
    for (const o of occupations) byId.set(o.id, o);
    for (const o of occupations) {
      if (o.parentId) {
        const list = cMap.get(o.parentId) ?? [];
        list.push(o);
        cMap.set(o.parentId, list);
      }
    }
    for (const list of cMap.values()) list.sort((a, b) => a.code.localeCompare(b.code));
    const roots = occupations.filter((o) => !o.parentId).sort((a, b) => a.code.localeCompare(b.code));
    return { byId, childrenOf: (id: string) => cMap.get(id) ?? [], roots };
  }, [occupations]);

  // Ancestor chain [root, ..., selected] derived from value — single source of truth.
  const chain = useMemo(() => {
    if (!value) return [] as Occupation[];
    const sel = byId.get(value);
    if (!sel) return [] as Occupation[];
    const arr = [sel];
    let cur = sel.parentId ? byId.get(sel.parentId) : undefined;
    while (cur) {
      arr.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return arr;
  }, [byId, value]);

  const selected = chain.length ? chain[chain.length - 1] : null;
  const selectedHasChildren = selected ? childrenOf(selected.id).length > 0 : false;

  // Levels to render: existing positions in chain, plus one expansion if deeper exists.
  const levels: Array<{ index: number; options: Occupation[]; selectedId: string }> = [];
  for (let i = 0; i < chain.length; i++) {
    const options = i === 0 ? roots : childrenOf(chain[i - 1].id);
    levels.push({ index: i, options, selectedId: chain[i].id });
  }
  if (chain.length > 0 && selectedHasChildren) {
    levels.push({ index: chain.length, options: childrenOf(selected!.id), selectedId: '' });
  } else if (chain.length === 0) {
    levels.push({ index: 0, options: roots, selectedId: '' });
  }

  function pick(node: Occupation) {
    onChange(node);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {levels.map((level) => (
          <div key={level.index} className="min-w-44 flex-1 sm:flex-none sm:basis-56">
            <label className={LABEL_CLASS}>Level {level.index + 1}</label>
            <select
              className={FIELD_CLASS}
              value={level.selectedId}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  onChange(null);
                  return;
                }
                const node = byId.get(id);
                if (node) pick(node);
              }}
            >
              <option value="">
                {allowCore && level.index === 0
                  ? 'Core — semua okupasi'
                  : requireLeaf
                    ? 'Pilih sampai level terakhir...'
                    : 'Pilih...'}
              </option>
              {level.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {selected &&
        (selectedHasChildren ? (
          <div className="rounded-lg bg-survey-lorng px-3.5 py-2.5 text-xs text-[#412402]">
            {requireLeaf
              ? `Okupasi "${selected.code} — ${selected.name}" masih punya anak. Pilih hingga level terakhir (tanpa anak).`
              : `Okupasi terpilih: ${selected.code} — ${selected.name} — berlaku juga untuk semua turunannya.`}
          </div>
        ) : (
          <div className="rounded-lg bg-survey-lgreen px-3.5 py-2.5 text-xs text-survey-green">
            ✅ <strong>Kode {selected.code}</strong> — {selected.name} (level {selected.level})
          </div>
        ))}
    </div>
  );
}
