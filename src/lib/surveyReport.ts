/**
 * Laporan naratif Survey Report + Risk Grading (PDF via dialog cetak browser).
 *
 * Port dari `buildReport()` / `buildRiskGradingReport()` / `_printGeneratedDoc()`
 * pada prototipe `src/public/Surver_Report__Revisi_Terbaru.html`
 * (SURVEY_HTML_B64, revisi terbaru) — poin review #9: hasil unduhan harus
 * menggambarkan isi form lengkap, baik isian biasa maupun catatan/essay.
 */
import { bandLabelOfScore, computeGradeScores, type GradeInputs, type GradeResult } from '../shared';
import type { Survey } from '../api/types';
import { GRADE_SECTION_META, GRADE_SECTION_ORDER } from './gradeSections';
import {
  ARAH_OPTIONS,
  DETEKTOR_DETAIL_FIELDS,
  GU_GROUPS,
  HIDRAN_DETAIL_FIELDS,
  OCC_BLOCKS,
  SPRINKLER_DETAIL_FIELDS,
  fieldValueLabel,
  isFieldVisible,
  type FieldDef,
} from './surveyForm';
import {
  C_KELAS_OPTIONS,
  C_PENALTY_OPTIONS,
  EX_KONDISI_OPTIONS,
  LE_JML_BANGUNAN_OPTIONS,
  LE_PEMISAH_OPTIONS,
  LOSS_KATEGORI_OPTIONS,
  M_CHECKLIST_ITEMS,
  M_IMPROVEMENT_OPTIONS,
  M_KLAIM_OPTIONS,
  M_REKOMENDASI_OPTIONS,
  NH_FLOOD_CRITERIA,
  NH_PETIR_OPTIONS,
  O_KIMIA_OPTIONS,
  OP_ADA_OPTIONS,
  P_APAR_OPTIONS,
  P_COMPONENT_OPTIONS,
  P_DAMKAR_OPTIONS,
  P_HIDRAN_OPTIONS,
} from './gradeOptions';
import { formatRp } from './format';
import type { OccBreakdownItem } from './occBreakdown';

export interface SurveyReportInput {
  info: {
    tertanggung: string;
    merk: string;
    alamat: string;
    kota: string;
    kodePos: string;
    gps: string;
    surveyDate: string;
    pelaksana: string;
    marketing: string;
    tsi: string;
    pic: string;
  };
  general: Record<string, string>;
  spJenis: string;
  special: Record<string, string>;
  upNotes: string;
  /** Nama file lampiran per bucket + foto tembakau 8.1–8.4. */
  uploadNames: string[];
  mAnswers: Record<string, string>;
  mKlaim: string;
  mImprovement: string;
  mRekomendasi: string;
  cKelas: string;
  cSandwich: string;
  cAcp: string;
  pApar: string;
  pHidran: string;
  pDetektor: string;
  pSprinkler: string;
  pDamkar: string;
  exKondisi: string;
  nhPetir: string;
  lePemisah: string;
  leJmlBangunan: string;
  gradeNotes: Record<string, string>;
  lossRows: Array<{ kategori: string; tanggal: string; cause: string; amount: string }>;
  claimRingkasan: string;
  occItem: OccBreakdownItem | null;
  occupancyDesc: string;
  facilities: Array<{ nama: string; arah: string; jarak: string }>;
  nhFlood: Record<string, string>;
  finalNotes: string;
  gempaZone: string;
  result: GradeResult;
}

// ---------------- helper ----------------

type Pair = [string, string];

const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;');

/** nilai yes/no → label Ya/Tidak; kosong → ''. */
function yn(value: string): string {
  if (value === 'yes') return 'Ya';
  if (value === 'no') return 'Tidak';
  return value ?? '';
}

function optLabel(options: Array<{ value: string; label: string }> | undefined, value: string): string {
  if (!value) return '';
  return options?.find((o) => o.value === value)?.label ?? value;
}

/** Tampilkan nilai atau penanda belum diisi. */
function filled(value: string): string {
  const v = (value ?? '').trim();
  return v === '' ? 'Belum dijawab' : v;
}

/** Baris dari deskcriptor field (hanya field yang tampil sesuai showWhen). */
function fieldRows(fields: FieldDef[], values: Record<string, string>): Pair[] {
  return fields
    .filter((f) => f.type !== 'heading' && f.type !== 'notice' && isFieldVisible(f, values))
    .map((f) => [f.label, fieldValueLabel(f, values[f.key] ?? '') || 'Belum dijawab'] as Pair);
}

function pairsTable(rows: Pair[]): string {
  return `<table>${rows
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('')}</table>`;
}

function section(title: string, rows: Pair[], extra = ''): string {
  const body = rows.length ? pairsTable(rows) : '<p><i>Belum diisi.</i></p>';
  return `<h2>${esc(title)}</h2>${body}${extra}`;
}

/** Blok essay/catatan (harus ikut tercetak — poin review #9). */
function essay(label: string, value: string): string {
  const v = (value ?? '').trim();
  return v ? `<p><b>${esc(label)}:</b> ${esc(v)}</p>` : `<p><i>${esc(label)}: belum diisi.</i></p>`;
}

function scoreTable(result: GradeResult): string {
  const rows = GRADE_SECTION_ORDER.map((code) => {
    const meta = GRADE_SECTION_META[code];
    const score = result.scores[code];
    return `<tr><td>${esc(meta.no)}</td><td>${esc(meta.name)}</td><td>${esc(meta.bobot)}</td><td>${esc(
      bandLabelOfScore(score),
    )}</td><td><b>${esc(String(score))}</b></td></tr>`;
  }).join('');
  return `<table><tr><th>#</th><th>Kategori</th><th>Bobot</th><th>Rating</th><th>Skor</th></tr>${rows}
    <tr><td></td><td><b>TOTAL</b></td><td></td><td><b>${esc(result.category)}</b></td><td><b>${esc(
      String(result.total),
    )}</b></td></tr></table>`;
}

function scaleTip(): string {
  return `<div class="tip"><strong>Skala Penilaian:</strong> 46–55 poin = GOOD | 31–45 poin = AVERAGE | 21–30 poin = MARGINAL | ≤ 20 poin = POOR</div>`;
}

function wrapDoc(title: string, subtitle: string, body: string): string {
  return (
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8"><title>' +
    esc(title) +
    '</title><style>@page{size:A4;margin:18mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}' +
    'h1{font-size:18pt;color:#1E3A5F;margin-bottom:2pt}h2{font-size:13pt;color:#1E3A5F;border-bottom:1px solid #1E3A5F;margin-top:16pt}' +
    'table{border-collapse:collapse;width:100%;margin:6pt 0}td,th{border:1px solid #999;padding:4pt 6pt;font-size:10pt;vertical-align:top}' +
    'th{background:#1E3A5F;color:#fff}td.k{background:#EEF2F7;width:34%;font-weight:bold}.sub{color:#666;font-size:9pt}' +
    '.tip{background:#EEF2F7;border:1px solid #2E6DA4;padding:6pt 8pt;font-size:10pt;margin-top:8pt}' +
    '</style></head><body><h1>' +
    esc(title) +
    '</h1><p class="sub">' +
    esc(subtitle) +
    '</p>' +
    body +
    '</body></html>'
  );
}

/** Nama file aman untuk dialog simpan PDF. */
export function reportFileSuffix(name: string): string {
  const safe = name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return safe || 'Tertanggung';
}

// ---------------- laporan lengkap (isian + essay) ----------------

export function buildSurveyReportHtml(data: SurveyReportInput): string {
  const { info } = data;

  // 1. Data objek
  const infoRows: Pair[] = [
    ['Nama Tertanggung', filled(info.tertanggung)],
    ['Nama Komersial / Merk', filled(info.merk)],
    ['Alamat Risiko', filled(info.alamat)],
    ['Kabupaten / Kota', filled(info.kota)],
    ['Kode Pos', filled(info.kodePos)],
    ['Koordinat GPS', filled(info.gps)],
    ['Tanggal Survey', filled(info.surveyDate)],
    ['Pelaksana Survey', filled(info.pelaksana)],
    ['PIC di Lokasi', filled(info.pic)],
    ['Cabang', filled(info.marketing)],
    ['Nilai Pertanggungan (TSI)', formatRp(info.tsi) || 'Belum dijawab'],
  ];

  // 2. Survey Umum — semua field yang tampil beserta nilainya
  const guRows: Pair[] = GU_GROUPS.flatMap((group) => fieldRows(group.fields, data.general));

  // 3. Survey Khusus Okupansi
  const spBlock = OCC_BLOCKS[data.spJenis];
  const spRows: Pair[] = [
    ['Kategori Okupansi', spBlock ? spBlock.label : 'Belum dipilih'],
    ...spBlock ? fieldRows(spBlock.fields, data.special) : [],
  ];

  // 4. Upload dokumen & foto (termasuk foto tembakau 8.1–8.4)
  const uploadList = data.uploadNames.length
    ? `<ul>${data.uploadNames.map((name) => `<li>${esc(name)}</li>`).join('')}</ul>`
    : '<p><i>Belum ada foto/dokumen yang diunggah.</i></p>';

  // 5. Management
  const mgmtRows: Pair[] = [
    ...M_CHECKLIST_ITEMS.map((item) => [item.label, yn(data.mAnswers[item.id] ?? '') || 'Belum dijawab'] as Pair),
    ['Jumlah klaim dalam 5 tahun terakhir', optLabel(M_KLAIM_OPTIONS, data.mKlaim) || 'Belum dijawab'],
    ['Risk improvement atas klaim sebelumnya', optLabel(M_IMPROVEMENT_OPTIONS, data.mImprovement) || 'Belum dijawab'],
    ['> 50% rekomendasi Aswata telah dijalankan?', optLabel(M_REKOMENDASI_OPTIONS, data.mRekomendasi) || 'Belum dijawab'],
  ];
  const lossTable = data.lossRows.length
    ? `<table><tr><th>Kategori</th><th>Date of Loss</th><th>Cause of Loss</th><th>Amount of Loss</th></tr>${data.lossRows
        .map(
          (row) =>
            `<tr><td>${esc(optLabel(LOSS_KATEGORI_OPTIONS, row.kategori) || '-')}</td><td>${esc(
              row.tanggal || '-',
            )}</td><td>${esc(row.cause || '-')}</td><td>${esc(formatRp(row.amount) || '-')}</td></tr>`,
        )
        .join('')}</table>`
    : '<p><i>Tidak ada riwayat kerugian yang dicatat.</i></p>';
  const managementSection = section(
    '5. Management',
    mgmtRows,
    lossTable + essay('Catatan Management', data.gradeNotes.management ?? ''),
  );

  // 6. Construction
  const constructionRows: Pair[] = [
    ['Kelas Konstruksi Bangunan', optLabel(C_KELAS_OPTIONS, data.cKelas) || 'Belum dijawab'],
    ['Jumlah Lantai', filled(data.special.c_lantai ?? '')],
    ['Luas Bangunan (m²)', filled(data.special.c_luas ?? '')],
    ['Tahun Dibangun', filled(data.special.c_tahun ?? '')],
    ['Combustible Sandwich Panel > 30% floor area?', optLabel(C_PENALTY_OPTIONS, data.cSandwich) || 'Belum dijawab'],
    ['Combustible ACP > 30% surface area?', optLabel(C_PENALTY_OPTIONS, data.cAcp) || 'Belum dijawab'],
  ];

  // 7. Occupancy
  const occupancyRows: Pair[] = [
    ['Breakdown Okupansi ASWATA', data.occItem ? `${data.occItem.code} — ${data.occItem.description}` : 'Belum dipilih'],
    [
      'Kategori Hazard Risk',
      data.occItem ? `${data.occItem.riskLabel} — Skor ${data.occItem.score} (${data.occItem.rating})` : 'Belum dipilih',
    ],
    ['Deskripsi aktivitas utama di lokasi', filled(data.occupancyDesc)],
    ['Penyimpanan / penggunaan bahan kimia berbahaya', optLabel(O_KIMIA_OPTIONS, data.special.o_kimia ?? '') || 'Belum dijawab'],
  ];

  // 8. Protection — status + blok detail yang tampil
  const protectionRows: Pair[] = [
    ['APAR — Alat Pemadam Api Ringan', optLabel(P_APAR_OPTIONS, data.pApar) || 'Belum dijawab'],
    ['Hidran — Unit Boks / Pillar Hidran', optLabel(P_HIDRAN_OPTIONS, data.pHidran) || 'Belum dijawab'],
  ];
  if (data.pHidran === 'good' || data.pHidran === 'avg') {
    protectionRows.push(...fieldRows(HIDRAN_DETAIL_FIELDS, data.special));
  }
  protectionRows.push(['Detektor Kebakaran Otomatis', optLabel(P_COMPONENT_OPTIONS, data.pDetektor) || 'Belum dijawab']);
  if (data.pDetektor === 'good' || data.pDetektor === 'avg') {
    protectionRows.push(...fieldRows(DETEKTOR_DETAIL_FIELDS, data.special));
  }
  protectionRows.push(['Sprinkler', optLabel(P_COMPONENT_OPTIONS, data.pSprinkler) || 'Belum dijawab']);
  if (data.pSprinkler === 'good' || data.pSprinkler === 'avg') {
    protectionRows.push(...fieldRows(SPRINKLER_DETAIL_FIELDS, data.special));
  }
  protectionRows.push([
    'Pemadam Kebakaran Publik — Estimasi Respons Time',
    optLabel(P_DAMKAR_OPTIONS, data.pDamkar) || 'Belum dijawab',
  ]);

  // 9. Exposure
  const exposureRows: Pair[] = [
    ['Kondisi fasilitas di sekitar bangunan tertanggung', optLabel(EX_KONDISI_OPTIONS, data.exKondisi) || 'Belum dijawab'],
  ];
  const facilityTable = data.facilities.length
    ? `<table><tr><th>Nama Fasilitas</th><th>Arah</th><th>Jarak</th></tr>${data.facilities
        .map(
          (row) =>
            `<tr><td>${esc(row.nama || '-')}</td><td>${esc(optLabel(ARAH_OPTIONS, row.arah) || '-')}</td><td>${esc(
              row.jarak || '-',
            )}</td></tr>`,
        )
        .join('')}</table>`
    : '';

  // 10. Natural Hazards
  const nhRows: Pair[] = [
    [
      'Gempa — Tarif & Zona Gempa OJK',
      data.gempaZone ? `Zona ${data.gempaZone} — ${data.gempaZone === '5' ? 'Marginal' : 'Average'}` : 'Belum terisi (isi Kabupaten/Kota di Info Umum)',
    ],
    ...NH_FLOOD_CRITERIA.map((c) => [c.label, yn(data.nhFlood[c.key] ?? '') || 'Belum dijawab'] as Pair),
    ['Petir — Penangkal Petir', optLabel(NH_PETIR_OPTIONS, data.nhPetir) || 'Belum dijawab'],
  ];

  // 11. Loss Estimate & Other Perils
  const lossRowsTable: Pair[] = [
    ['Ada Pemisah Antar Bangunan (Fire Wall / Jarak Aman)?', optLabel(LE_PEMISAH_OPTIONS, data.lePemisah) || 'Belum dijawab'],
    ['Jumlah Bangunan', optLabel(LE_JML_BANGUNAN_OPTIONS, data.leJmlBangunan) || 'Belum dijawab'],
    ['Other Perils — risiko khusus lain', optLabel(OP_ADA_OPTIONS, data.special.op_ada ?? '') || 'Belum dijawab'],
  ];

  // 13. Catatan akhir surveyor (essay keseluruhan)
  const finalNotesSection = `<h2>13. Catatan Akhir Surveyor</h2>${
    data.finalNotes.trim() ? `<p>${esc(data.finalNotes)}</p>` : '<p><i>Belum diisi.</i></p>'
  }`;

  const body =
    section('1. Data Objek Pertanggungan', infoRows) +
    section('2. Survey Umum', guRows) +
    section('3. Survey Khusus Okupansi', spRows) +
    `<h2>4. Upload Dokumen & Foto</h2>${uploadList}${essay('Catatan Terkait Dokumen / Foto', data.upNotes)}` +
    managementSection +
    section('6. Construction', constructionRows, essay('Catatan Konstruksi', data.gradeNotes.construction ?? '')) +
    section('7. Occupancy', occupancyRows, essay('Deskripsi / Catatan Occupancy', data.gradeNotes.occupancy ?? '')) +
    section('8. Protection', protectionRows, essay('Keterangan tambahan proteksi kebakaran', data.gradeNotes.protection ?? '')) +
    section('9. Exposure', exposureRows, facilityTable + essay('Deskripsi fasilitas / bangunan di sekitar', data.gradeNotes.exposure ?? '')) +
    section('10. Natural Hazards', nhRows, essay('Catatan Natural Hazards', data.gradeNotes.natural_hazards ?? '')) +
    section('11. Loss Estimate & Other Perils', lossRowsTable,
      essay('Penjelasan risiko khusus lain', data.gradeNotes.other_peril ?? '') +
      essay('Catatan tambahan surveyor', data.gradeNotes.loss_estimate ?? '')) +
    // "Hasil Risk Grading" dihapus dari laporan survey — skor/grade punya
    // dokumen unduhan tersendiri (buildRiskGradingHtml).
    `<h2>12. Riwayat Klaim & Kerugian</h2>${essay('Ringkasan kejadian & tindak lanjut', data.claimRingkasan)}` +
    finalNotesSection;

  return wrapDoc('Laporan Survey Risiko Properti', `PT Asuransi Wahana Tata — Survey Report · ${info.tertanggung || '-'}`, body);
}

// ---------------- laporan ringkas risk grading ----------------

export function buildRiskGradingHtml(data: SurveyReportInput): string {
  const body = `<p>${esc(data.info.tertanggung || '(belum diisi)')} — Survey: ${esc(
    data.info.surveyDate || '-',
  )}</p><p><b>${esc(data.result.category)}</b> — Total Skor: <b>${esc(String(data.result.total))} / 55 poin</b></p>${scoreTable(
    data.result,
  )}${scaleTip()}`;
  return wrapDoc('Risk Grading — Property', `Internal ASWATA · ${data.info.tertanggung || '-'}`, body);
}

// ---------------- cetak via iframe tersembunyi ----------------

/**
 * Port `_printGeneratedDoc`: tulis dokumen ke iframe nol-ukuran lalu buka
 * dialog cetak browser (pilih "Save as PDF" untuk mengunduh).
 */
export function printGeneratedDoc(doc: string, fname: string): void {
  document.getElementById('pdf-frame')?.remove();
  const frame = document.createElement('iframe');
  frame.id = 'pdf-frame';
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    window.print();
    return;
  }
  const docWin = win.document;
  docWin.open();
  docWin.write(doc);
  docWin.close();
  const oldTitle = document.title;
  document.title = fname;
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      window.print();
    }
    setTimeout(() => {
      document.title = oldTitle;
    }, 1500);
  }, 300);
}

// ---------------- konversi Survey (API) → SurveyReportInput ----------------

/**
 * Susun input laporan dari survey tersimpan (property.extraData) supaya halaman
 * detail — baik surveyor maupun admin — bisa mengunduh Survey Report & Risk
 * Grading dengan format yang sama persis dengan step "Hasil" di wizard.
 */
const EMPTY_GRADE_INPUTS: GradeInputs = {
  mAnswers: { m1: '', m2: '', m3: '', m4: '', m7: '' },
  mChecklist: [],
  mKlaim: '',
  mImprovement: '',
  mRekomendasi: '',
  cKelas: '',
  cSandwich: '',
  cAcp: '',
  oHazard: '',
  pApar: '',
  pHidran: '',
  pDetektor: '',
  pSprinkler: '',
  pDamkar: '',
  exKondisi: '',
  nhGempa: '',
  nhBanjir: '',
  nhPetir: '',
  lePemisah: '',
  leJmlBangunan: '',
  tsi: 0,
  cLantai: 0,
  spJenis: '',
  oHazardCat: '',
};

export function surveyToReportInput(survey: Survey): SurveyReportInput {
  const ex = (survey.property.extraData ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof ex[k] === 'string' ? (ex[k] as string).trim() : '');
  const num = (k: string) => (typeof ex[k] === 'number' ? String(ex[k]) : '');
  const rec = (k: string) =>
    ex[k] && typeof ex[k] === 'object' ? (ex[k] as Record<string, string>) : {};

  // Okupasi breakdown ASWATA
  const occRaw = (ex.occBreakdown ?? null) as Record<string, unknown> | null;
  const occItem =
    occRaw && typeof occRaw.code === 'string'
      ? {
          code: occRaw.code,
          description: String(occRaw.description ?? ''),
          riskKey: String(occRaw.riskKey ?? ''),
          riskLabel: String(occRaw.riskLabel ?? ''),
          score: Number(occRaw.score ?? 0),
          rating: String(occRaw.rating ?? ''),
          sourceSheet: '',
        }
      : null;

  // Input penilaian tersimpan (gradeInputs = effInputs dari wizard, sudah
  // termasuk field turunan seperti oHazard/nhGempa/tsi).
  const gi = { ...EMPTY_GRADE_INPUTS, ...(ex.gradeInputs as Partial<GradeInputs> | null) };
  const result = computeGradeScores(gi);

  const lossRows = (Array.isArray(ex.lossRows)
    ? (ex.lossRows as Array<Record<string, string>>)
    : []
  ).map((r) => ({
    kategori: r.kategori ?? '',
    tanggal: r.tanggal ?? '',
    cause: r.cause ?? '',
    amount: r.amount ?? '',
  }));

  const facilities = (Array.isArray(ex.facilities)
    ? (ex.facilities as Array<Record<string, string>>)
    : []
  ).map((r) => ({ nama: r.nama ?? '', arah: r.arah ?? '', jarak: r.jarak ?? '' }));

  // notes = "Deskripsi aktivitas utama: …\n\n<catatan akhir>" (lihat submitSurvey)
  let finalNotes = survey.notes ?? '';
  const descPrefix = `Deskripsi aktivitas utama: ${str('occupancyDesc')}`;
  if (str('occupancyDesc') && finalNotes.startsWith(descPrefix)) {
    finalNotes = finalNotes.slice(descPrefix.length).replace(/^\n+/, '');
  }

  const info: SurveyReportInput['info'] = {
    tertanggung: survey.property.name,
    merk: str('merk'),
    alamat: survey.property.address,
    kota: str('kota'),
    kodePos: str('kodePos'),
    gps: str('gps'),
    surveyDate: (survey.surveyDate ?? survey.createdAt).slice(0, 10),
    pelaksana: str('pelaksana'),
    marketing: str('marketing'),
    tsi: num('tsi'),
    pic: str('pic'),
  };

  return {
    info,
    general: rec('general'),
    spJenis: typeof ex.jenisOkupansi === 'string' ? ex.jenisOkupansi : '',
    special: rec('special'),
    upNotes: str('uploadNotes'),
    uploadNames: (survey.attachments ?? []).map((a) => a.fileName),
    mAnswers: gi.mAnswers,
    mKlaim: gi.mKlaim,
    mImprovement: gi.mImprovement,
    mRekomendasi: gi.mRekomendasi,
    cKelas: gi.cKelas,
    cSandwich: gi.cSandwich,
    cAcp: gi.cAcp,
    pApar: gi.pApar,
    pHidran: gi.pHidran,
    pDetektor: gi.pDetektor,
    pSprinkler: gi.pSprinkler,
    pDamkar: gi.pDamkar,
    exKondisi: gi.exKondisi,
    nhPetir: gi.nhPetir,
    lePemisah: gi.lePemisah,
    leJmlBangunan: gi.leJmlBangunan,
    gradeNotes: rec('gradeNotes'),
    lossRows,
    claimRingkasan: str('lossRingkasan'),
    occItem,
    occupancyDesc: str('occupancyDesc'),
    facilities,
    nhFlood: rec('nhFlood'),
    finalNotes,
    gempaZone: str('gempaZone'),
    result,
  };
}
