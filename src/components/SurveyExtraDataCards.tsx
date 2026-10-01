import { GU_GROUPS, OCC_BLOCKS, fieldValueLabel, type FieldDef } from '../lib/surveyForm';
import { KATEGORI_OKUPANSI_OPTIONS } from '../lib/gradeOptions';

/**
 * Render seluruh data wizard survey yang tersimpan di property.extraData —
 * dipakai bersama SurveyDetail, AdminSurveyReview, dan AdminReports agar
 * tampilan data survey konsisten di semua halaman (base = data dari survey).
 *
 * Mencakup: info tambahan (merk/kota/GPS/TSI/marketing/jenis okupansi),
 * deskripsi aktivitas utama, Survey Umum (grup A–F), Khusus Okupansi
 * (+ field grading: lantai/luas/tahun, kimia, dapur, forklift, other perils),
 * catatan dokumen, dan riwayat klaim.
 */

/** Field grading yang disimpan di special tapi bukan bagian OCC_BLOCKS. */
export const EXTRA_SPECIAL_LABELS: Record<string, string> = {
  c_lantai: 'Jumlah Lantai',
  c_luas: 'Luas Bangunan (m²)',
  c_tahun: 'Tahun Dibangun',
  o_kimia: 'Bahan Kimia Berbahaya',
  o_dapur: 'Dapur / Kitchen',
  o_forklift: 'Forklift Listrik (charging baterai)',
  op_ada: 'Other Perils — risiko khusus',
};

const EXTRA_SPECIAL_VALUE_LABELS: Record<string, Record<string, string>> = {
  o_kimia: { none: 'Tidak ada', small: 'Ada — jumlah kecil', large: 'Ada — jumlah besar' },
  o_dapur: { no: 'Tidak ada', yes: 'Ada' },
  o_forklift: { no: 'Tidak ada', yes: 'Ada' },
  op_ada: { no: 'Tidak ada catatan khusus', yes: 'Ada catatan khusus' },
};

const NUMERIC_EXTRA_KEYS = new Set(['c_lantai', 'c_luas', 'c_tahun']);

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function formatExtraSpecial(key: string, raw: string): string {
  const map = EXTRA_SPECIAL_VALUE_LABELS[key];
  if (map) return map[raw] ?? raw;
  if (NUMERIC_EXTRA_KEYS.has(key)) {
    const n = Number(raw);
    return Number.isFinite(n) && raw !== '' ? n.toLocaleString('id-ID') : raw;
  }
  return raw;
}

export function SurveyExtraDataCards({ extra }: { extra: Record<string, unknown> | null | undefined }) {
  const general = (extra?.general ?? {}) as Record<string, string>;
  const special = (extra?.special ?? {}) as Record<string, string>;
  const lossHistory = (extra?.lossHistory ?? {}) as Record<string, string>;
  const jenisOkupansi = str(extra?.jenisOkupansi);

  const infoRows: Array<{ label: string; value: string }> = [
    { label: 'Nama Komersial / Merk', value: str(extra?.merk) },
    { label: 'Jenis Okupansi', value: KATEGORI_OKUPANSI_OPTIONS.find((o) => o.value === str(extra?.kategoriOkupansi))?.label ?? '' },
    { label: 'Kota / Kabupaten', value: str(extra?.kota) },
    { label: 'Koordinat GPS', value: str(extra?.gps) },
    { label: 'Marketing / Cabang', value: str(extra?.marketing) },
    { label: 'Nilai Pertanggungan (TSI)', value: typeof extra?.tsi === 'number' ? `Rp ${extra.tsi.toLocaleString('id-ID')}` : '' },
    { label: 'Deskripsi Aktivitas Utama', value: str(extra?.occupancyDesc) },
    { label: 'Catatan Dokumen / Foto', value: str(extra?.uploadNotes) },
  ].filter((r) => r.value !== '');

  const hasGeneral = Object.values(general).some((v) => (v ?? '').trim() !== '');

  // Field Khusus Okupansi (sesuai jenis usaha) + field grading tambahan.
  const blockFields = OCC_BLOCKS[jenisOkupansi]?.fields ?? [];
  const extraSpecialRows = Object.keys(EXTRA_SPECIAL_LABELS)
    .filter((key) => (special[key] ?? '').trim() !== '')
    .map((key) => ({ key, label: EXTRA_SPECIAL_LABELS[key], value: formatExtraSpecial(key, (special[key] ?? '').trim()) }));
  const unusedBlockRows = blockFields
    .map((f) => ({ f, raw: (special[f.key] ?? '').trim() }))
    .filter((r) => r.raw !== '')
    .map((r) => ({ key: r.f.key, label: r.f.label, value: fieldValueLabel(r.f as FieldDef, r.raw) }));
  const specialRows = [...unusedBlockRows, ...extraSpecialRows];

  return (
    <>
      {infoRows.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Info Tambahan</h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {infoRows.map((r) => (
              <div key={r.label} className="flex justify-between gap-3">
                <dt className="text-slate-500">{r.label}</dt>
                <dd className="text-right font-medium text-slate-800">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {hasGeneral &&
        GU_GROUPS.map((group) => {
          const rows = group.fields
            .map((f) => ({ f, raw: (general[f.key] ?? '').trim() }))
            .filter((r) => r.raw !== '')
            .map((r) => ({ f: r.f, value: fieldValueLabel(r.f, r.raw) }));
          if (rows.length === 0) return null;
          return (
            <div key={group.title} className="card">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Survey Umum — {group.title}
              </h3>
              <dl className="space-y-1.5">
                {rows.map(({ f, value }) => (
                  <div key={f.key} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <dt className="font-medium text-slate-700">{f.label}</dt>
                    <dd className="mt-0.5 text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}

      {specialRows.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Khusus Okupansi{jenisOkupansi && OCC_BLOCKS[jenisOkupansi] ? ` — ${OCC_BLOCKS[jenisOkupansi].label}` : ''}
          </h3>
          <dl className="space-y-1.5">
            {specialRows.map((row) => (
              <div key={row.key} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <dt className="font-medium text-slate-700">{row.label}</dt>
                <dd className="mt-0.5 text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {(lossHistory.lhJumlah || lossHistory.lhNilai) && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Riwayat Klaim (Loss History)</h3>
          <dl className="space-y-2 text-sm">
            {lossHistory.lhJumlah && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Jumlah klaim 5 tahun terakhir</dt>
                <dd className="font-medium text-slate-800">{lossHistory.lhJumlah}</dd>
              </div>
            )}
            {lossHistory.lhNilai && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Total nilai klaim</dt>
                <dd className="font-medium text-slate-800">Rp {Number(lossHistory.lhNilai).toLocaleString('id-ID')}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </>
  );
}
