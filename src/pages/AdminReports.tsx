import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { api } from '../api/client';
import type { ReportData, Survey } from '../api/types';
import { Spinner } from '../components/Spinner';
import { StatusBadge } from '../components/StatusBadge';
import { SurveyExtraDataCards, EXTRA_SPECIAL_LABELS } from '../components/SurveyExtraDataCards';
import { formatBytes, formatDateTime } from '../lib/format';
import { GU_GROUPS, fieldValueLabel } from '../lib/surveyForm';

export function AdminReports() {
  const [params] = useSearchParams();
  const selectedId = params.get('surveyId') ?? '';

  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await api.get('/surveys');
      return res.data.data.surveys as Survey[];
    },
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', selectedId],
    queryFn: async () => {
      const res = await api.get(`/reports/${selectedId}`);
      return res.data.data.report as ReportData;
    },
    enabled: !!selectedId,
  });

  async function exportXlsx() {
    if (!report) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Report');

    // Title
    ws.mergeCells('A1:H1');
    const title = ws.getCell('A1');
    title.value = 'Laporan Survey & Risk Grade';
    title.font = { bold: true, size: 16 };
    title.alignment = { horizontal: 'center' };

    ws.mergeCells('A2:H2');
    ws.getCell('A2').value = report.property.name;
    ws.getCell('A2').alignment = { horizontal: 'center' };
    ws.getCell('A2').font = { size: 12 };

    ws.addRow([]);

    // Property info
    const extra = (report.property.extraData ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

    ws.addRow(['Nama Properti', report.property.name]);
    ws.addRow(['Alamat', report.property.address]);
    ws.addRow(['Pemilik', report.property.ownerName]);
    if (str(extra.merk)) ws.addRow(['Nama Komersial / Merk', str(extra.merk)]);
    if (str(extra.kategoriOkupansi)) ws.addRow(['Jenis Okupansi', str(extra.kategoriOkupansi)]);
    if (str(extra.kota)) ws.addRow(['Kota / Kabupaten', str(extra.kota)]);
    if (str(extra.gps)) ws.addRow(['Koordinat GPS', str(extra.gps)]);
    if (str(extra.marketing)) ws.addRow(['Marketing / Cabang', str(extra.marketing)]);
    if (typeof extra.tsi === 'number') ws.addRow(['Nilai Pertanggungan (TSI)', `Rp ${extra.tsi.toLocaleString('id-ID')}`]);
    if (str(extra.occupancyDesc)) ws.addRow(['Deskripsi Aktivitas Utama', str(extra.occupancyDesc)]);
    if (str(extra.uploadNotes)) ws.addRow(['Catatan Dokumen / Foto', str(extra.uploadNotes)]);
    ws.addRow(['Level 1 (Industri)', report.property.occupation.level1 ?? '-']);
    ws.addRow(['Level 2 (Sub)', report.property.occupation.level2 ?? '-']);
    ws.addRow(['Level 3', report.property.occupation.level3]);
    ws.addRow(['Surveyor', report.surveyor.name]);
    ws.addRow(['Tanggal Survei', formatDateTime(report.surveyDate ?? report.createdAt)]);
    ws.addRow(['Status', report.status]);

    // Survey Umum (grup A–F) dari extraData.general
    const general = (extra.general ?? {}) as Record<string, string>;
    const special = (extra.special ?? {}) as Record<string, string>;
    const generalRows = GU_GROUPS.flatMap((g) =>
      g.fields
        .map((f) => ({ label: `${g.title} — ${f.label}`, value: fieldValueLabel(f, (general[f.key] ?? '').trim()) }))
        .filter((r) => r.value !== ''),
    );
    if (generalRows.length > 0) {
      ws.addRow([]);
      ws.addRow(['SURVEY UMUM']).eachCell((cell) => (cell.font = { bold: true }));
      generalRows.forEach((r) => ws.addRow([r.label, r.value]));
    }

    // Khusus Okupansi + field grading tambahan dari extraData.special
    const specialRows = Object.entries(special)
      .filter(([, v]) => str(v) !== '')
      .map(([key, v]) => {
        const label = EXTRA_SPECIAL_LABELS[key] ?? key;
        return { label, value: str(v) };
      });
    if (specialRows.length > 0) {
      ws.addRow([]);
      ws.addRow(['KHUSUS OKUPANSI']).eachCell((cell) => (cell.font = { bold: true }));
      specialRows.forEach((r) => ws.addRow([r.label, r.value]));
    }

    // Riwayat Klaim (Loss History)
    const lossHistory = (extra.lossHistory ?? {}) as Record<string, string>;
    if (lossHistory.lhJumlah || lossHistory.lhNilai) {
      ws.addRow([]);
      ws.addRow(['RIWAYAT KLAIM (LOSS HISTORY)']).eachCell((cell) => (cell.font = { bold: true }));
      if (lossHistory.lhJumlah) ws.addRow(['Jumlah klaim 5 tahun terakhir', lossHistory.lhJumlah]);
      if (lossHistory.lhNilai) ws.addRow(['Total nilai klaim', `Rp ${Number(lossHistory.lhNilai).toLocaleString('id-ID')}`]);
    }

    ws.addRow([]);

    // Answers by section
    if (report.answers.length > 0) {
      ws.addRow([]);
      ws.addRow(['JAWABAN SURVEYOR']);
      report.answers.forEach((section) => {
        ws.addRow([`[${section.section}]`]).eachCell((cell) => (cell.font = { bold: true }));
        section.items.forEach((it) => {
          ws.addRow([it.question, it.value]);
        });
      });
    }

    ws.addRow([]);

    // Items
    const header = ws.addRow(['Aspek', 'Skor', 'Notes']);
    header.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    });
    report.items.forEach((item) => {
      ws.addRow([item.name, item.score, item.notes ?? '']);
    });

    // Total
    const totalRow = ws.addRow(['TOTAL', report.items.reduce((s, i) => s + i.score, 0), '']);
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(2).font = { bold: true };

    ws.addRow([]);

    // Grading
    if (report.grading.gradeBelumDinasilkan) {
      ws.addRow(['Risk Grade', 'Belum dinilai']);
    } else {
      ws.addRow(['Total Skor Grade', report.grading.totalScore ?? '-']);
      ws.addRow(['Kategori', report.grading.categoryLabel ?? '-']);
      ws.addRow(['Catatan', report.grading.notes ?? '']);
      ws.addRow(['Dinilai oleh', report.grading.adminName ?? '']);
      ws.addRow(['Waktu', report.grading.gradedAt ? formatDateTime(report.grading.gradedAt) : '']);
    }

    // Attachment list (informational)
    ws.addRow([]);
    ws.addRow(['Lampiran:']);
    ws.addRow(['Nama File', 'Tipe', 'Ukuran']).eachCell((cell) => (cell.font = { bold: true }));
    report.attachments.forEach((a) => {
      ws.addRow([a.fileName, a.kind, formatBytes(a.sizeBytes)]);
    });

    // Widths
    ws.columns = [
      { width: 24 }, { width: 14 }, { width: 8 }, { width: 40 },
      { width: 12 }, { width: 20 }, { width: 20 }, { width: 20 },
    ];

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `laporan-survey-${report.id}.xlsx`);
  }

  if (surveysLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="no-print flex flex-wrap items-center gap-3">
        <select
          className="input max-w-md"
          value={selectedId}
          onChange={(e) => {
            const v = e.target.value;
            window.location.href = v ? `/admin/reports?surveyId=${v}` : '/admin/reports';
          }}
        >
          <option value="">Pilih survey...</option>
          {(surveys ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.property.name} — {s.status}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => window.print()} disabled={!report}>
            🖨 Cetak / PDF
          </button>
          <button type="button" className="btn-primary" onClick={exportXlsx} disabled={!report || reportLoading}>
            ⬇ Ekspor XLSX
          </button>
        </div>
      </div>

      {/* Preview */}
      {!selectedId ? (
        <div className="card py-16 text-center text-sm text-slate-400">
          Pilih survey di atas untuk melihat laporan.
        </div>
      ) : reportLoading ? (
        <Spinner />
      ) : report ? (
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none">
          <ReportBody report={report} />
        </div>
      ) : (
        <div className="card">Laporan tidak bisa dimuat.</div>
      )}
    </div>
  );
}

function ReportBody({ report }: { report: ReportData }) {
  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4 text-center">
        <div className="text-2xl font-bold text-slate-800">Laporan Survey & Risk Grade</div>
        <div className="mt-1 text-lg font-semibold text-slate-600">{report.property.name}</div>
        <div className="mt-0.5 text-xs text-slate-400">
          {report.property.address} · Survey: {formatDateTime(report.surveyDate ?? report.createdAt)}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <div><span className="text-slate-500">Pemilik:</span> <strong>{report.property.ownerName}</strong></div>
        <div><span className="text-slate-500">Surveyor:</span> <strong>{report.surveyor.name} ({report.surveyor.email})</strong></div>
        <div><span className="text-slate-500">Okupasi L1:</span> {report.property.occupation.level1 ?? '-'}</div>
        <div className=""><span className="text-slate-500">Okupasi L2:</span> {report.property.occupation.level2 ?? '-'}</div>
        <div><span className="text-slate-500">Okupasi L3:</span> <strong>{report.property.occupation.level3}</strong></div>
        <div><span className="text-slate-500">Status:</span> <StatusBadge status={report.status} /></div>
      </div>

      {/* Data wizard surveyor — base data dari survey (extraData) */}
      <SurveyExtraDataCards extra={report.property.extraData} />

      {report.answers.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Jawaban Surveyor</h4>
          {report.answers.map((section) => (
            <div key={section.section} className="mb-3">
              <h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">{section.section}</h5>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2">
                {section.items.map((it) => (
                  <div key={it.question} className="flex justify-between gap-3 text-sm">
                    <dt className="text-slate-500">{it.question}</dt>
                    <dd className="shrink-0 font-medium text-slate-800">{it.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}

      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Penilaian Risiko</h4>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <th className="py-2 pr-2">No</th>
            <th className="py-2 pr-2">Aspek</th>
            <th className="py-2 pr-2">Notes</th>
            <th className="py-2 text-right">Skor</th>
          </tr>
        </thead>
        <tbody>
          {report.items.map((item, i) => (
            <tr key={item.code} className="border-b border-slate-100">
              <td className="py-1.5 pr-2 text-slate-400">{i + 1}</td>
              <td className="py-1.5 pr-2 font-medium">{item.name}</td>
              <td className="py-1.5 pr-2 text-xs text-slate-500">{item.notes ?? ''}</td>
              <td className="py-1.5 text-right font-semibold">{item.score}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-1.5 pr-2" />
            <td className="py-1.5 pr-2">Total</td>
            <td className="py-1.5 pr-2" />
            <td className="py-1.5 text-right">{report.items.reduce((s, i) => s + i.score, 0)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        {report.grading.gradeBelumDinasilkan ? (
          <div className="text-sm font-medium text-slate-500">
            Risk Grade: <span className="text-amber-600">Belum dinilai</span>
            <div className="mt-1 text-xs text-slate-300">
              Survei belum melalui penilaian 8 item risiko oleh admin.
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium text-slate-500">Risk Grade:</span>
            <span className="text-2xl font-bold text-slate-800">{report.grading.totalScore}</span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-white">
              {report.grading.categoryLabel}
            </span>
          </div>
        )}
        {report.grading.notes && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{report.grading.notes}</p>
        )}
        <div className="mt-2 text-xs text-slate-400">
          {!report.grading.gradeBelumDinasilkan && report.grading.adminName
            ? `Dinilai oleh ${report.grading.adminName} · ${formatDateTime(report.grading.gradedAt)}`
            : ''}
        </div>
        <div className="mt-1 text-[10px] text-slate-300">
          Skala: ≤20 Poor · ≤30 Marginal · ≤45 Average · ≤64 Good
        </div>
      </div>

      {report.attachments.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Lampiran ({report.attachments.length})
          </h4>
          <ul className="space-y-1 text-sm text-slate-500">
            {report.attachments.map((a) => (
              <li key={a.fileName} className="flex items-center justify-between">
                <span className="truncate">{a.fileName}</span>
                <span className="ml-3 shrink-0 text-xs">{a.kind} · {formatBytes(a.sizeBytes)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}