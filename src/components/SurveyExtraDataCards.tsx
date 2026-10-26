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
  const occBreakdown = (extra?.occBreakdown ?? null) as Record<string, unknown> | null;
  const lossRows = Array.isArray(extra?.lossRows) ? (extra.lossRows as Array<Record<string, string>>) : [];
  const facilities = Array.isArray(extra?.facilities) ? (extra.facilities as Array<Record<string, string>>) : [];
  const gempaZone = str(extra?.gempaZone);

  const infoRows: Array<{ label: string; value: string }> = [
    { label: 'Nama Komersial / Merk', value: str(extra?.merk) },
    { label: 'Jenis Okupansi', value: KATEGORI_OKUPANSI_OPTIONS.find((o) => o.value === str(extra?.kategoriOkupansi))?.label ?? '' },
    { label: 'Kabupaten / Kota', value: str(extra?.kota) },
    { label: 'Kode Pos', value: str(extra?.kodePos) },
    { label: 'Koordinat GPS', value: str(extra?.gps) },
    { label: 'Marketing / Cabang', value: str(extra?.marketing) },
    { label: 'PIC di Lokasi', value: str(extra?.pic) },
    { label: 'Pelaksana Survey', value: str(extra?.pelaksana) },
    { label: 'Nilai Pertanggungan (TSI)', value: typeof extra?.tsi === 'number' ? `Rp ${extra.tsi.toLocaleString('id-ID')}` : '' },
    {
      label: 'Breakdown Okupansi ASWATA',
      value:
        occBreakdown && typeof occBreakdown.code === 'string'
          ? `${occBreakdown.code} — ${str(occBreakdown.riskLabel) || str(occBreakdown.description)} (skor ${String(occBreakdown.score ?? '')})`
          : '',
    },
    { label: 'Zona Gempa OJK', value: gempaZone ? `Zona ${gempaZone}` : '' },
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

      {(lossHistory.lhJumlah || lossHistory.lhNilai || lossRows.length > 0 || str(extra?.lossRingkasan)) && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Riwayat Klaim & Kerugian (5 Tahun Terakhir)</h3>
          <dl className="space-y-2 text-sm">
            {lossHistory.lhJumlah && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Jumlah klaim 5 tahun terakhir</dt>
                <dd className="font-medium text-slate-800">
                  {lossHistory.lhJumlah === '0'
                    ? '0 klaim'
                    : lossHistory.lhJumlah === '1-2'
                      ? '1–2 klaim'
                      : lossHistory.lhJumlah === '3+'
                        ? '≥ 3 klaim'
                        : lossHistory.lhJumlah}
                </dd>
              </div>
            )}
            {lossHistory.lhNilai && Number(lossHistory.lhNilai) > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Total nilai klaim</dt>
                <dd className="font-medium text-slate-800">Rp {Number(lossHistory.lhNilai).toLocaleString('id-ID')}</dd>
              </div>
            )}
            {str(extra?.lossRingkasan) && (
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="font-medium text-slate-700">Ringkasan Kejadian & Tindak Lanjut</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{str(extra?.lossRingkasan)}</dd>
              </div>
            )}
          </dl>
          {lossRows.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-500">
                    <th className="border border-slate-200 px-2 py-1.5">Kategori</th>
                    <th className="border border-slate-200 px-2 py-1.5">Date of Loss</th>
                    <th className="border border-slate-200 px-2 py-1.5">Cause of Loss</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-right">Amount of Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {lossRows.map((row, i) => (
                    <tr key={i}>
                      <td className="border border-slate-200 px-2 py-1.5">{row.kategori ?? ''}</td>
                      <td className="border border-slate-200 px-2 py-1.5">{row.tanggal ?? ''}</td>
                      <td className="border border-slate-200 px-2 py-1.5">{row.cause ?? ''}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-right">
                        {row.amount ? `Rp ${Number(row.amount).toLocaleString('id-ID')}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {facilities.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Jarak ke Fasilitas Terdekat</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-500">
                  <th className="border border-slate-200 px-2 py-1.5">Nama Fasilitas</th>
                  <th className="border border-slate-200 px-2 py-1.5">Arah</th>
                  <th className="border border-slate-200 px-2 py-1.5">Jarak</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-slate-200 px-2 py-1.5">{row.nama ?? ''}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{row.arah ?? ''}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{row.jarak ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
