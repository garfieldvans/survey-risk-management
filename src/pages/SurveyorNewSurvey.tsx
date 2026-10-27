import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, API_URL } from '../api/client';
import { Spinner } from '../components/Spinner';
import { OccupationBreakdownSelect } from '../components/OccupationBreakdownSelect';
import type { OccBreakdownItem } from '../lib/occBreakdown';
import {
  computeGradeScores,
  getHidranWajibStatus,
  M_ASPECT_IDS,
  type GradeInputs,
  type MAspectId,
} from '../shared';
import { errorMessage, formatRp, groupDigits } from '../lib/format';
import { protectionGoodLocked } from '../lib/protectionLock';
import {
  buildRiskGradingHtml,
  buildSurveyReportHtml,
  printGeneratedDoc,
  reportFileSuffix,
  type SurveyReportInput,
} from '../lib/surveyReport';
import { useAuth } from '../hooks/useAuth';
import {
  ARAH_OPTIONS,
  DETEKTOR_DETAIL_FIELDS,
  GU_GROUPS,
  HIDRAN_DETAIL_FIELDS,
  OCC_BLOCKS,
  SPRINKLER_DETAIL_FIELDS,
  missingRequiredFields,
} from '../lib/surveyForm';
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
} from '../lib/gradeOptions';
import { KAB_KOTA_ZONE_MAP } from '../lib/gempaZones';
import { ProgressSteps } from '../components/survey/ProgressSteps';
import { Divider, SectionCard, SubHeading } from '../components/survey/SectionCard';
import { FieldGrid } from '../components/survey/FieldGrid';
import { SelectField, TextAreaField, TextField } from '../components/survey/TextField';
import { ChoiceGroup } from '../components/survey/ChoiceGroup';
import { YNRow } from '../components/survey/YNRow';
import { TipBox } from '../components/survey/TipBox';
import { UploadField } from '../components/survey/UploadField';
import { ResultCard } from '../components/survey/ResultCard';
import { FIELD_CLASS, LABEL_CLASS } from '../components/survey/tokens';
import { Req } from '../components/survey/SectionCard';

// ============================================================
// Wizard 12 langkah — port 1:1 dari prototipe revisi terbaru
// src/public/Surver_Report__Revisi_Terbaru.html (SURVEY_HTML_B64)
// 0 Info Umum · 1 Survey Umum · 2 Khusus Okupansi · 3 Upload Dok.
// 4 Management · 5 Construction · 6 Occupancy · 7 Protection
// 8 Exposure · 9 Nat. Hazards · 10 Loss Est. · 11 Hasil
// ============================================================

const BASE_STEPS = [
  'Info Umum',
  'Survey Umum',
  'Khusus Okupansi',
  'Upload Dok.',
  'Management',
  'Construction',
  'Occupancy',
  'Protection',
  'Exposure',
  'Nat. Hazards',
  'Loss Est.',
  'Hasil',
];

// Bucket lampiran — 1:1 seksi Upload Dokumen pada prototipe HTML revisi terbaru
// ("Dokumen Legal & Pendukung" dihapus; Layout Proteksi Kebakaran, Form Hot
// Work Permit, dan MSDS ditambahkan — poin review #7).
const UPLOAD_BUCKETS = [
  {
    key: 'foto',
    label: '📷 Foto Bangunan',
    fieldLabel: 'Tampak Depan, Samping, Dalam, dll.',
    hint: 'Bisa pilih beberapa foto sekaligus',
    accept: 'image/*',
    kind: 'photo' as const,
    multiple: true,
  },
  {
    key: 'site_layout',
    label: '🗺️ General Site Layout',
    fieldLabel: 'Upload general site layout / denah keseluruhan lokasi',
    hint: 'Contoh: site plan, denah bangunan, posisi area utama, akses masuk/keluar.',
    accept: 'image/*,.pdf,.doc,.docx',
    kind: 'document' as const,
    multiple: false,
  },
  {
    key: 'fire_layout',
    label: '🔥 Layout Proteksi Kebakaran',
    fieldLabel: 'Upload layout proteksi kebakaran',
    hint: 'Tunjukkan posisi APAR, hydrant, automatic fire detection system, sprinkler, dan proteksi lain yang tersedia.',
    accept: 'image/*,.pdf,.doc,.docx',
    kind: 'document' as const,
    multiple: false,
  },
  {
    key: 'hot_work',
    label: '📝 Form Hot Work Permit',
    fieldLabel: 'Upload form / contoh Hot Work Permit',
    hint: 'Dokumen izin kerja panas yang digunakan di lokasi, jika tersedia.',
    accept: 'image/*,.pdf,.doc,.docx',
    kind: 'document' as const,
    multiple: false,
  },
  {
    key: 'msds',
    label: '🧪 MSDS (UNTUK PABRIK DAN GUDANG KIMIA)',
    fieldLabel: 'Upload Material Safety Data Sheet (MSDS)',
    hint: 'Digunakan untuk okupansi Pabrik dan Gudang Kimia. Bisa unggah lebih dari satu dokumen.',
    accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
    kind: 'document' as const,
    multiple: true,
  },
];

// ---------- default grading inputs (fallback reff.html) ----------

// Semua pilihan wajib dimulai kosong ('') — surveyor harus memilih eksplisit
// sebelum boleh lanjut langkah (validasi required, lihat STEP_REQUIRED_KEYS).
type GradeInputsDraft = {
  [K in keyof GradeInputs]: GradeInputs[K] extends string ? GradeInputs[K] | '' : GradeInputs[K];
};

const DEFAULT_GRADE_INPUTS: GradeInputsDraft = {
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

type UploadBucketKey = 'foto' | 'site_layout' | 'fire_layout' | 'hot_work' | 'msds';

// ---------- foto checklist gudang tembakau 8.1–8.4 (revisi prototipe) ----------

const TB_PHOTO_FIELDS = [
  { key: 'tb81', prefix: '8.1', label: '8.1 — Foto jenis kemasan tembakau' },
  { key: 'tb82', prefix: '8.2', label: '8.2 — Foto ketinggian tumpukan' },
  { key: 'tb83', prefix: '8.3', label: '8.3 — Foto jarak antar tumpukan' },
  { key: 'tb84', prefix: '8.4', label: '8.4 — Foto kondisi ventilasi gudang' },
] as const;

type TbPhotoKey = (typeof TB_PHOTO_FIELDS)[number]['key'];

// Field detail proteksi (HIDRAN/DETEKTOR/SPRINKLER_DETAIL_FIELDS) & ARAH_OPTIONS
// dipindah ke src/lib/surveyForm.ts agar bisa dipakai laporan PDF naratif.

/** Baris detail kerugian/klaim (Loss History per kejadian). */
type LossRow = { id: number; kategori: string; tanggal: string; cause: string; amount: string };

/** Baris jarak ke fasilitas terdekat (Exposure). */
type FacilityRow = { id: number; nama: string; arah: string; jarak: string };

/** Pemetaan skor Breakdown ASWATA → value oHazard (kompatibel grading lama). */
function mapOccToHazard(item: OccBreakdownItem): GradeInputs['oHazard'] {
  if (item.score >= 8) return '8';
  if (item.score === 6) return item.code === '29371' ? '6b' : '6a';
  return item.riskKey === 'energy' ? '4c' : item.riskKey === 'high' || item.riskKey === 'mhr3' ? '4b' : '4a';
}

// Bentuk tersimpannya draft (POST /surveys/drafts). Semua state form ikut
// ter-serialize kecuali lampiran (objek File tidak bisa diserialisasi —// diunggah ulang saat pengiriman).
type DraftPayload = {
  v: 1;
  /** Langkah terakhir yang sedang dikerjakan — dipulihkan saat "Lanjutkan". */
  step: number;
  /** Progres kelengkapan untuk ditampilkan di daftar Survei Saya. */
  progress: { done: number; total: number };
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
  gi: GradeInputsDraft;
  gradeNotes: Record<string, string>;
  lossRows: LossRow[];
  claimRingkasan: string;
  occItem: OccBreakdownItem | null;
  occupancyDesc: string;
  facilities: FacilityRow[];
  nhFlood: Record<string, string>;
  finalNotes: string;
  savedAt: string;
};

export function SurveyorNewSurvey() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  /** Langkah yang dicoba dilewati tapi belum lengkap — untuk menampilkan blok error navigasi. */
  const [navAttempted, setNavAttempted] = useState<number | null>(null);

  // ---- Step 0: Info Umum ----
  const [tertanggung, setTertanggung] = useState('');
  const [merk, setMerk] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kota, setKota] = useState('');
  const [kodePos, setKodePos] = useState('');
  const [gps, setGps] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().slice(0, 10));
  // Pelaksana Survey — prototipe: input teks bebas, default diisi dari akun surveyor
  const [pelaksana, setPelaksana] = useState(user?.name ?? '');
  const [marketing, setMarketing] = useState('');
  const [tsi, setTsi] = useState('');
  const [pic, setPic] = useState('');

  // ---- Step 1 & 2: jawaban umum + khusus okupansi (field descriptor-driven) ----
  const [general, setGeneral] = useState<Record<string, string>>({});
  const [spJenis, setSpJenis] = useState('');
  const [special, setSpecial] = useState<Record<string, string>>({});

  // ---- Step 3: Upload ----
  const [uploads, setUploads] = useState<Record<UploadBucketKey, File[]>>({
    foto: [],
    site_layout: [],
    fire_layout: [],
    hot_work: [],
    msds: [],
  });
  // Foto checklist gudang tembakau 8.1–8.4 (diisi langsung di blok okupansi).
  const [tbFotos, setTbFotos] = useState<Record<TbPhotoKey, File[]>>({ tb81: [], tb82: [], tb83: [], tb84: [] });
  const [upNotes, setUpNotes] = useState('');

  // ---- Steps 4–10: grading inputs + catatan per section ----
  const [gi, setGi] = useState<GradeInputsDraft>(DEFAULT_GRADE_INPUTS);
  const [gradeNotes, setGradeNotes] = useState<Record<string, string>>({});
  // Management — riwayat klaim (revisi: pindah dari Loss Estimate ke Management)
  const [lossRows, setLossRows] = useState<LossRow[]>([]);
  const [claimRingkasan, setClaimRingkasan] = useState('');
  const lossRowIdRef = useRef(0);
  // Occupancy — Breakdown Okupansi ASWATA (menggantikan pemilihan manual hazard)
  const [occItem, setOccItem] = useState<OccBreakdownItem | null>(null);
  const [occupancyDesc, setOccupancyDesc] = useState('');
  // Exposure — baris jarak ke fasilitas terdekat
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const facilityIdRef = useRef(0);
  // Natural Hazards — 5 kriteria Banjir (Ya/Tidak)
  const [nhFlood, setNhFlood] = useState<Record<string, string>>({});
  const [finalNotes, setFinalNotes] = useState('');

  // ---- Draft: isian sementara (tersimpan server-side, kedaluwarsa 30 hari) ----
  const [searchParams] = useSearchParams();
  const draftParam = searchParams.get('draft');
  // Id draft diakses lewat ref supaya autosave berantai tidak memakai id basi
  // (lihat saveDraft) — UI tidak perlu merender id-nya.
  const [draftLoading, setDraftLoading] = useState(!!draftParam);
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  // Isian kosong saat menekan "Kirim" — ditawarkan untuk dilengkapi dulu,
  // tapi surveyor tetap boleh memaksakan kirim (akan ditandai "Belum dijawab").
  const [pendingReview, setPendingReview] = useState<
    Array<{ step: number; label: string; msg: string }> | null
  >(null);

  // Anti-duplikasi: bila survei sudah terbuat tapi sebagian lampiran gagal
  // diunggah, retry hanya mengunggah ulang lampiran (bukan membuat survei baru).
  const createdSurveyIdRef = useRef<string | null>(null);
  const uploadedKeysRef = useRef<Set<string>>(new Set());  // Wizard selalu tepat 12 langkah — persis prototipe (langkah "Pertanyaan"
  // kuesioner DB dihapus sesuai keputusan penyelarasan dengan HTML).
  const steps = BASE_STEPS;
  const IDX = {
    upload: 3,
    management: 4,
    construction: 5,
    occupancy: 6,
    protection: 7,
    exposure: 8,
    nh: 9,
    loss: 10,
    hasil: 11,
  };

  // ---- nilai turunan (port perilaku JS prototipe) ----
  // Zona Gempa OJK otomatis dari Kabupaten/Kota (Tabel III.D SEOJK 6/2017)
  const gempaZone = KAB_KOTA_ZONE_MAP[kota.trim()] ?? '';
  // Blok foto tembakau 8.1–8.4 tampil saat okupansi Gudang + komoditas Tembakau.
  const showTbPhotos = spJenis === 'gudang' && (special.gd_komoditas ?? '') === 'tembakau';
  const effGempa = gempaZone ? (gempaZone === '5' ? 'marg' : 'avg') : '';
  const floodComplete = NH_FLOOD_CRITERIA.every((c) => (nhFlood[c.key] ?? '') !== '');
  const effBanjir = floodComplete
    ? NH_FLOOD_CRITERIA.every((c) => nhFlood[c.key] === 'yes')
      ? 'avg'
      : 'marg'
    : '';

  // Input grading efektif: menggabungkan jawaban wizard + konteks (TSI/lantai/
  // kategori okupansi/zona gempa) sesuai kontrak grading engine.
  function buildEffInputs(): GradeInputsDraft {
    return {
      ...gi,
      oHazard: occItem ? mapOccToHazard(occItem) : '',
      nhGempa: effGempa,
      nhBanjir: effBanjir,
      tsi: Number(tsi) || 0,
      cLantai: Number(special.c_lantai || '') || 0,
      spJenis,
      oHazardCat: occItem?.riskKey ?? '',
    };
  }

  const gradeResult = useMemo(
    () => computeGradeScores(buildEffInputs() as GradeInputs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gi, occItem, kota, nhFlood, tsi, special, spJenis],
  );

  // Status Syarat Wajib Hydrant (prototipe: getHidranWajibStatus)
  const hidranStatus = useMemo(
    () => getHidranWajibStatus(buildEffInputs() as GradeInputs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gi, occItem, kota, nhFlood, tsi, special, spJenis],
  );

  // Kunci "Ada & Fungsional" saat ada pertanyaan lanjutan berjawab Tidak /
  // Tidak Tahu — port refreshProtectionFunctionalLock (poin review #8).
  const lockHidran = protectionGoodLocked('hidran', special);
  const lockDetektor = protectionGoodLocked('detektor', special);
  const lockSprinkler = protectionGoodLocked('sprinkler', special);

  // Bila status masih "Ada & Fungsional" ketika jawaban negatif muncul,
  // turunkan otomatis ke "Ada (dengan catatan)" lalu kunci pilihannya.
  useEffect(() => {
    if (lockHidran && gi.pHidran === 'good') setGI('pHidran', 'avg');
    if (lockDetektor && gi.pDetektor === 'good') setGI('pDetektor', 'avg');
    if (lockSprinkler && gi.pSprinkler === 'good') setGI('pSprinkler', 'avg');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockHidran, lockDetektor, lockSprinkler, gi.pHidran, gi.pDetektor, gi.pSprinkler]);

  // Input grading yang wajib dipilih sebelum boleh lanjut/loncat melewati langkahnya.
  const STEP_REQUIRED_KEYS: Record<number, Array<keyof GradeInputs>> = {
    [IDX.management]: ['mKlaim', 'mRekomendasi'],
    [IDX.construction]: ['cKelas', 'cSandwich', 'cAcp'],
    [IDX.occupancy]: ['oHazard'],
    [IDX.protection]: ['pApar', 'pHidran', 'pDetektor', 'pSprinkler', 'pDamkar'],
    [IDX.exposure]: ['exKondisi'],
    [IDX.nh]: ['nhGempa', 'nhBanjir', 'nhPetir'],
    [IDX.loss]: ['leJmlBangunan'],
  };

  // Requirement per langkah: pesan error bila langkah belum boleh dilewati.
  const stepInvalid = useMemo(() => {
    const errors: Record<number, string> = {};
    const eff = buildEffInputs();
    // Step 0 — Info Umum
    const miss0: string[] = [];
    if (!tertanggung.trim()) miss0.push('Nama tertanggung');
    if (!alamat.trim()) miss0.push('Alamat risiko');
    if (!kota.trim() || !gempaZone) miss0.push('Kabupaten / Kota (pilih dari daftar)');
    if (!/^\d{5}$/.test(kodePos.trim())) miss0.push('Kode Pos (5 digit)');
    if (!gps.trim()) miss0.push('Koordinat GPS');
    if (!tsi.trim()) miss0.push('Nilai Pertanggungan / TSI');
    if (miss0.length > 0) errors[0] = `Wajib diisi: ${miss0.join(', ')}.`;
    // Step 1 — Survey Umum: pertanyaan penting (ya/tidak & pilihan) grup A–F
    for (const g of GU_GROUPS) {
      for (const f of g.fields) {
        if ((f.type === 'yesno' || f.type === 'select') && !(general[f.key] ?? '').trim()) {
          errors[1] = 'Masih ada pertanyaan penting Survey Umum yang belum dijawab.';
        }
      }
    }
    // Step 2 — Khusus Okupansi
    if (!spJenis) errors[2] = 'Pilih jenis usaha / okupansi spesifik terlebih dahulu.';
    // Step 4 — Management: 5 aspek inti Y/N wajib semua
    if (M_ASPECT_IDS.some((id) => (eff.mAnswers?.[id] ?? '') === '')) {
      errors[IDX.management] = 'Jawab seluruh 5 aspek Management (Ya / Tidak).';
    }
    // Risk improvement wajib hanya jika ada klaim (sesuai prototipe)
    if (
      !errors[IDX.management] &&
      eff.mKlaim !== '' &&
      eff.mKlaim !== '0' &&
      eff.mImprovement === ''
    ) {
      errors[IDX.management] = 'Risk improvement atas klaim sebelumnya wajib dijawab (ada klaim).';
    }
    // Step 5 — Construction: Jumlah Lantai wajib
    if (!(special.c_lantai ?? '').trim()) {
      errors[IDX.construction] = 'Isi Jumlah Lantai pada seksi Construction.';
    }
    // Step 7 — Protection: blok detail wajib saat komponen "Ada"
    if (!errors[IDX.protection] && (gi.pHidran === 'good' || gi.pHidran === 'avg')) {
      const missing = missingRequiredFields(HIDRAN_DETAIL_FIELDS, special);
      if (missing.length > 0) errors[IDX.protection] = `Hidran — masih ada ${missing.length} detail wajib yang belum diisi.`;
    }
    if (!errors[IDX.protection] && (gi.pDetektor === 'good' || gi.pDetektor === 'avg')) {
      const missing = missingRequiredFields(DETEKTOR_DETAIL_FIELDS, special);
      if (missing.length > 0) errors[IDX.protection] = `Detektor — masih ada ${missing.length} detail wajib yang belum diisi.`;
    }
    if (!errors[IDX.protection] && (gi.pSprinkler === 'good' || gi.pSprinkler === 'avg')) {
      const missing = missingRequiredFields(SPRINKLER_DETAIL_FIELDS, special);
      if (missing.length > 0) errors[IDX.protection] = `Sprinkler — masih ada ${missing.length} detail wajib yang belum diisi.`;
    }
    // Step grading — pilihan wajib per seksi (+ deskripsi aktivitas wajib di Occupancy)
    if (!occupancyDesc.trim()) errors[IDX.occupancy] = 'Isi deskripsi aktivitas utama di lokasi.';
    for (const [idxStr, keys] of Object.entries(STEP_REQUIRED_KEYS)) {
      const idx = Number(idxStr);
      if (errors[idx]) continue;
      const missing = (keys as Array<keyof GradeInputs>).filter((k) => String(eff[k] ?? '') === '');
      if (missing.length > 0) {
        errors[idx] = `Masih ada ${missing.length} pilihan wajib di seksi ini yang belum dipilih.`;
      }
    }
    return errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tertanggung, alamat, general, spJenis, gi, occupancyDesc, kota, gempaZone, kodePos, gps, tsi, nhFlood, occItem, special]);

  // ===================== Draft: simpan / pulihkan =====================
  const draftIdRef = useRef<string | null>(draftParam);
  // draftParam yang SUDAH dimuat (null = belum ada yang dimuat) — efek load
  // melewati id yang sudah pernah diterapkan supaya autosave tidak reload state.
  const loadedDraftRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const payloadRef = useRef<DraftPayload | null>(null);

  function buildDraftPayload(): DraftPayload {
    const missing = Object.keys(stepInvalid)
      .map(Number)
      .filter((i) => i < steps.length - 1);
    return {
      v: 1,
      step,
      progress: { done: steps.length - 1 - missing.length, total: steps.length - 1 },
      info: { tertanggung, merk, alamat, kota, kodePos, gps, surveyDate, pelaksana, marketing, tsi, pic },
      general,
      spJenis,
      special,
      upNotes,
      gi,
      gradeNotes,
      lossRows,
      claimRingkasan,
      occItem,
      occupancyDesc,
      facilities,
      nhFlood,
      finalNotes,
      savedAt: new Date().toISOString(),
    };
  }

  /** Pulihkan seluruh state wizard dari draft yang tersimpan. */
  function applyDraftPayload(p: DraftPayload | null | undefined) {
    if (!p || typeof p !== 'object') return;
    const info = p.info ?? ({} as DraftPayload['info']);
    setTertanggung(info.tertanggung ?? '');
    setMerk(info.merk ?? '');
    setAlamat(info.alamat ?? '');
    setKota(info.kota ?? '');
    setKodePos(info.kodePos ?? '');
    setGps(info.gps ?? '');
    setSurveyDate(info.surveyDate ?? new Date().toISOString().slice(0, 10));
    setPelaksana(info.pelaksana ?? user?.name ?? '');
    setMarketing(info.marketing ?? '');
    setTsi(info.tsi ?? '');
    setPic(info.pic ?? '');
    setStep(Math.max(0, Math.min(p.step ?? 0, steps.length - 1)));
    setGeneral(p.general ?? {});
    setSpJenis(p.spJenis ?? '');
    setSpecial(p.special ?? {});
    setUpNotes(p.upNotes ?? '');
    setGi({ ...DEFAULT_GRADE_INPUTS, ...(p.gi ?? {}) });
    setGradeNotes(p.gradeNotes ?? {});
    const lossRowsNext = p.lossRows ?? [];
    lossRowIdRef.current = lossRowsNext.reduce((m, r) => Math.max(m, r.id ?? 0), 0);
    setLossRows(lossRowsNext);
    setClaimRingkasan(p.claimRingkasan ?? '');
    setOccItem(p.occItem ?? null);
    setOccupancyDesc(p.occupancyDesc ?? '');
    const facilitiesNext = p.facilities ?? [];
    facilityIdRef.current = facilitiesNext.reduce((m, r) => Math.max(m, r.id ?? 0), 0);
    setFacilities(facilitiesNext);
    setNhFlood(p.nhFlood ?? {});
    setFinalNotes(p.finalNotes ?? '');
    setPendingReview(null);
  }

  /**
   * Simpan draft ke server (upsert per id). `silent` dipakai autosave — tidak
   * mengubah indikator UI dan tidak menampilkan error.
   * Request dibatasi satu dalam vuelo; permintaan berikutnya diantre.
   */
  async function saveDraft(opts?: { silent?: boolean }): Promise<void> {
    const silent = opts?.silent ?? false;
    if (draftLoading) return;
    if (savingRef.current) {
      queuedSaveRef.current = true;
      return;
    }
    // Autosave tidak membuat draft kosong — draft baru minimal sudah ada nama
    // tertanggung (klik manual "Simpan Draft" tetap disimpan apa adanya).
    if (silent && !draftIdRef.current && !tertanggung.trim()) return;
    savingRef.current = true;
    if (!silent) setDraftState('saving');
    try {
      const res = await api.post('/surveys/drafts', {
        id: draftIdRef.current ?? undefined,
        data: buildDraftPayload(),
      });
      const saved = res.data.data.draft as { id: string; updatedAt: string };
      draftIdRef.current = saved.id;
      loadedDraftRef.current = saved.id;
      setDraftSavedAt(saved.updatedAt);
      setDraftState('saved');
      // Rekam id di URL supaya refresh browser tetap tahu draft mana yang dibuka.
      if (!silent && !draftParam) navigate(`/surveys/new?draft=${saved.id}`, { replace: true });
    } catch (err) {
      if (!silent) {
        setDraftState('error');
        setError(errorMessage(err));
      }
    } finally {
      savingRef.current = false;
      if (queuedSaveRef.current) {
        queuedSaveRef.current = false;
        void saveDraft({ silent: true });
      }
    }
  }

  // Muat draft yang dibuka lewat tombol "Lanjutkan" (\?draft=ID).
  useEffect(() => {
    if (!draftParam || loadedDraftRef.current === draftParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/surveys/drafts/${draftParam}`);
        const d = res.data.data.draft as { id: string; data: DraftPayload; updatedAt: string };
        if (cancelled) return;
        applyDraftPayload(d.data);
        draftIdRef.current = d.id;
        loadedDraftRef.current = d.id;
        setDraftSavedAt(d.updatedAt);
        setDraftState('saved');
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setDraftLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftParam]);

  // Snapshot terbaru untuk penyimpanan saat tab ditutup.
  useEffect(() => {
    payloadRef.current = buildDraftPayload();
  });

  // Autosave saat tab ditutup/dipindah — axios tidak mendukung `keepalive`,
  // jadi memakai fetch langsung dengan credentials cookie yang sama.
  useEffect(() => {
    const persist = () => {
      const payload = payloadRef.current;
      if (!payload) return;
      const id = draftIdRef.current;
      if (!id && !payload.info.tertanggung.trim()) return; // belum ada isi sama sekali
      void fetch(`${API_URL}/api/surveys/drafts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id ?? undefined, data: payload }),
        keepalive: true,
      }).catch(() => undefined);
    };
    window.addEventListener('pagehide', persist);
    return () => window.removeEventListener('pagehide', persist);
  }, []);

  function setG(key: string, v: string) {
    setGeneral((prev) => ({ ...prev, [key]: v }));
  }
  function setS(key: string, v: string) {
    setSpecial((prev) => ({ ...prev, [key]: v }));
  }
  function setGI<K extends keyof GradeInputs>(key: K, v: GradeInputsDraft[K]) {
    setGi((prev) => ({ ...prev, [key]: v }));
  }
  function setMAnswer(id: MAspectId, v: 'yes' | 'no') {
    setGi((prev) => {
      const mAnswers = { ...prev.mAnswers, [id]: v };
      const mChecklist = M_ASPECT_IDS.filter((x) => mAnswers[x] === 'yes');
      return { ...prev, mAnswers, mChecklist };
    });
  }

  // ---- Management: baris detail kerugian ----
  function addLossRow() {
    lossRowIdRef.current += 1;
    setLossRows((prev) => [...prev, { id: lossRowIdRef.current, kategori: '', tanggal: '', cause: '', amount: '' }]);
  }
  function updateLossRow(id: number, patch: Partial<LossRow>) {
    setLossRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }
  function removeLossRow(id: number) {
    setLossRows((prev) => prev.filter((row) => row.id !== id));
  }

  // ---- Exposure: baris fasilitas sekitar ----
  function addFacilityRow() {
    facilityIdRef.current += 1;
    setFacilities((prev) => [...prev, { id: facilityIdRef.current, nama: '', arah: '', jarak: '' }]);
  }
  function updateFacilityRow(id: number, patch: Partial<FacilityRow>) {
    setFacilities((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }
  function removeFacilityRow(id: number) {
    setFacilities((prev) => prev.filter((row) => row.id !== id));
  }

  function getGPS() {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung GPS.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setGpsLoading(false);
      },
      () => {
        setError('Tidak dapat mengakses GPS. Pastikan izin lokasi diberikan.');
        setGpsLoading(false);
      },
    );
  }

  function goNext() {
    setError('');
    // Kunci isian wajib (poin review #1): blokir maju selama langkah ini belum lengkap.
    const issue = stepInvalid[step];
    if (issue) {
      setNavAttempted(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setNavAttempted(null);
    setStep((s) => Math.min(s + 1, steps.length - 1));
    void saveDraft({ silent: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goPrev() {
    setError('');
    setNavAttempted(null);
    setStep((s) => Math.max(s - 1, 0));
    void saveDraft({ silent: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goTo(n: number) {
    setError('');
    setPendingReview(null);
    // Port `goTo` prototipe: melompat maju memvalidasi tiap langkah di antaranya;
    // isian kosong memindahkan ke langkah bermasalah dan menampilkan errornya.
    if (n > step) {
      for (let i = step; i < n; i++) {
        const issue = stepInvalid[i];
        if (issue) {
          setNavAttempted(i);
          if (i !== step) setStep(i);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }
    setNavAttempted(null);
    setStep(n);
    void saveDraft({ silent: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function addFiles(bucket: UploadBucketKey, files: File[]) {
    setUploads((prev) => ({ ...prev, [bucket]: [...prev[bucket], ...files] }));
  }
  function removeFile(bucket: UploadBucketKey, index: number) {
    setUploads((prev) => ({ ...prev, [bucket]: prev[bucket].filter((_, i) => i !== index) }));
  }

  async function submitSurvey() {
    setError('');
    // Cek sebelum kirim — navigasi juga sudah dikunci per langkah, tapi
    // kelengkapan tetap diperiksa ulang di sini (tidak ada lagi opsi paksa).
    const missing = Object.keys(stepInvalid)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((i) => i < steps.length - 1)
      .map((i) => ({ step: i, label: steps[i], msg: stepInvalid[i] }));
    if (missing.length > 0) {
      setPendingReview(missing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPendingReview(null);
    setSubmitting(true);
    try {
      const effInputs = buildEffInputs() as GradeInputs;
      const totalLossAmount = lossRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      // 1) Buat survey (dilewati bila retry setelah kegagalan upload lampiran)
      let surveyId = createdSurveyIdRef.current;
      if (!surveyId) {
        const res = await api.post('/surveys', {
        property: {
          name: tertanggung,
          address: alamat,
          ownerName: tertanggung,
          extraData: {
            merk,
            kota,
            kodePos,
            gps,
            pic,
            pelaksana: pelaksana.trim() || undefined,
            marketing,
            tsi: tsi === '' ? null : Number(tsi),
            kategoriOkupansi: null,
            jenisOkupansi: spJenis || null,
            occBreakdown: occItem
              ? {
                  code: occItem.code,
                  description: occItem.description,
                  riskKey: occItem.riskKey,
                  riskLabel: occItem.riskLabel,
                  score: occItem.score,
                  rating: occItem.rating,
                }
              : null,
            gempaZone: gempaZone || null,
            nhFlood: floodComplete ? nhFlood : null,
            general,
            special,
            uploadNotes: upNotes || undefined,
            occupancyDesc: occupancyDesc.trim() || undefined,
            // Riwayat klaim (format lama, tetap dikirim untuk kompatibilitas laporan)
            lossHistory: { lhJumlah: gi.mKlaim, lhNilai: String(totalLossAmount) },
            // Detail klaim per kejadian (revisi: diisi di langkah Management)
            lossRows: lossRows.map(({ kategori, tanggal, cause, amount }) => ({ kategori, tanggal, cause, amount })),
            lossRingkasan: claimRingkasan.trim() || undefined,
            // Jarak ke fasilitas terdekat (revisi: baris dinamis di Exposure)
            facilities: facilities.map(({ nama, arah, jarak }) => ({ nama, arah, jarak })),
          },
        },
        surveyDate: surveyDate ? new Date(surveyDate).toISOString() : undefined,
        notes:
          [occupancyDesc.trim() ? `Deskripsi aktivitas utama: ${occupancyDesc.trim()}` : '', finalNotes.trim()]
            .filter(Boolean)
            .join('\n\n') || undefined,
        answers: [],
        grading: {
          inputs: effInputs,
          notes: {
            management: gradeNotes.management || undefined,
            construction: gradeNotes.construction || undefined,
            occupancy: gradeNotes.occupancy || undefined,
            protection: gradeNotes.protection || undefined,
            exposure: gradeNotes.exposure || undefined,
            natural_hazards: gradeNotes.natural_hazards || undefined,
            other_peril: gradeNotes.other_peril || undefined,
            loss_estimate: gradeNotes.loss_estimate || undefined,
          },
        },
      });
        surveyId = res.data.data.survey.id;
        createdSurveyIdRef.current = surveyId;
      }

      // 2) Upload lampiran per bucket (kind sesuai bucket). Satu file gagal
      // tidak menggagalkan yang lain — nama file yang gagal dikumpulkan.
      const failed: string[] = [];
      for (const bucket of UPLOAD_BUCKETS) {
        for (const file of uploads[bucket.key as UploadBucketKey]) {
          const uploadKey = `${bucket.key}:${file.name}:${file.size}`;
          if (uploadedKeysRef.current.has(uploadKey)) continue;
          const formData = new FormData();
          formData.append('file', file);
          formData.append('kind', bucket.kind);
          try {
            await api.post(`/surveys/${surveyId}/attachments`, formData);
            uploadedKeysRef.current.add(uploadKey);
          } catch {
            failed.push(file.name);
          }
        }
      }

      // 2b) Foto checklist Gudang Tembakau 8.1–8.4 — nomor butir disimpan pada
      // nama file ("8.1 - ...") agar foto tetap terkait pertanyaannya (revisi prototipe).
      for (const field of TB_PHOTO_FIELDS) {
        for (const file of tbFotos[field.key]) {
          const uploadKey = `tb:${field.key}:${file.name}:${file.size}`;
          if (uploadedKeysRef.current.has(uploadKey)) continue;
          const renamed = new File([file], `${field.prefix} - ${file.name}`, { type: file.type });
          const formData = new FormData();
          formData.append('file', renamed);
          formData.append('kind', 'photo');
          try {
            await api.post(`/surveys/${surveyId}/attachments`, formData);
            uploadedKeysRef.current.add(uploadKey);
          } catch {
            failed.push(renamed.name);
          }
        }
      }

      if (failed.length > 0) {
        setError(
          `Survei sudah tersimpan, namun ${failed.length} lampiran gagal diunggah: ${failed.join(', ')}. ` +
            'Klik "Kirim Survei" sekali lagi untuk mencoba mengunggah ulang (data survei tidak akan dobel).',
        );
        return;
      }

      // Survei berhasil terkirim — buang draft agar tidak muncul lagi di daftar.
      if (draftIdRef.current) {
        try {
          await api.delete(`/surveys/drafts/${draftIdRef.current}`);
        } catch {
          // best-effort — draft tetap kedaluwarsa otomatis dalam 30 hari
        }
        draftIdRef.current = null;
      }

      navigate(`/surveys/${surveyId}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Isian seluruh langkah (termasuk catatan/essay) untuk dokumen laporan PDF.
   * Sumber data = state form ini, jadi unduhan selalu mencerminkan isian terkini.
   */
  function buildReportInput(): SurveyReportInput {
    return {
      info: { tertanggung, merk, alamat, kota, kodePos, gps, surveyDate, pelaksana, marketing, tsi, pic },
      general,
      spJenis,
      special,
      upNotes,
      uploadNames: [
        ...UPLOAD_BUCKETS.flatMap((bucket) =>
          (uploads[bucket.key as UploadBucketKey] ?? []).map((file) => `${bucket.label}: ${file.name}`),
        ),
        ...TB_PHOTO_FIELDS.flatMap((field) => tbFotos[field.key].map((file) => `${field.prefix} - ${file.name}`)),
      ],
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
      gradeNotes,
      lossRows,
      claimRingkasan,
      occItem,
      occupancyDesc,
      facilities,
      nhFlood,
      finalNotes,
      gempaZone,
      result: gradeResult,
    };
  }

  const spBlock = spJenis ? OCC_BLOCKS[spJenis] : undefined;
  // Overall Natural Hazards — kombinasi Gempa + Banjir + Petir (prototipe)
  const nhComplete = !!effGempa && floodComplete && !!gi.nhPetir;
  const nhOverall = nhComplete
    ? effGempa === 'avg' && effBanjir === 'avg' && gi.nhPetir === 'avg'
      ? 'Average'
      : 'Marginal'
    : '';

  return (
    <>
      {/* Header ASWATA full-bleed ada di SurveyorLayout (.app-header reff.html).
          Di sini hanya strip progress navy (.progress-wrap reff.html). */}
      {draftLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
      <>
      <ProgressSteps labels={steps} current={step} onSelect={goTo} invalidSteps={stepInvalid} />

      <div className="mx-auto w-full max-w-[900px] px-4 py-5 pb-16 sm:px-6">
      {navAttempted !== null && navAttempted === step && stepInvalid[step] && (
        <div className="mb-4 rounded-lg border border-survey-red bg-survey-lred px-4 py-3.5 text-sm text-survey-red">
          <p className="font-semibold">⛔ Langkah ini belum lengkap — isian wajib harus diisi dulu sebelum melanjutkan.</p>
          <p className="mt-1">{stepInvalid[step]}</p>
        </div>
      )}
      {pendingReview && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <p className="font-semibold">
            ⚠️ Ada {pendingReview.length} isian yang masih kosong. Lengkapi dulu sebelum mengirim —
            isian wajib harus terisi semua.
          </p>
          <ul className="mt-2.5 space-y-1">
            {pendingReview.map((m) => (
              <li key={m.step}>
                <button
                  type="button"
                  onClick={() => goTo(m.step)}
                  className="text-left font-medium text-amber-950 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700"
                >
                  Langkah {m.step + 1} · {m.label}
                </button>
                <span className="text-amber-800"> — {m.msg}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goTo(pendingReview[0].step)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-amber-700"
            >
              ← Lengkapi dulu
            </button>
            <button
              type="button"
              onClick={() => setPendingReview(null)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              Nanti dulu
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-survey-lred px-4 py-3 text-sm text-survey-red">{error}</div>
      )}

      {/* ============ STEP 0: INFO UMUM ============ */}
      {step === 0 && (
        <SectionCard icon="clipboard" title="Informasi Umum Survey" sub="Data dasar objek risiko yang disurvey">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Nama Tertanggung" required value={tertanggung} onChange={setTertanggung} placeholder="PT / CV / Nama Perorangan" />
            <TextField label="Nama Komersial / Merk" value={merk} onChange={setMerk} placeholder="Nama usaha / brand" />
          </div>

          <TextAreaField label="Alamat Risiko Lengkap" required value={alamat} onChange={setAlamat} rows={3} placeholder="Jalan, nomor, kelurahan, kecamatan, kota, provinsi" />

          <TextField
            label="Kabupaten / Kota"
            required
            value={kota}
            onChange={setKota}
            listId="kab-kota-list"
            listOptions={Object.keys(KAB_KOTA_ZONE_MAP)}
            hint="Pilih Kabupaten/Kota dari daftar. Zona Gempa OJK pada tab Natural Hazards akan terisi otomatis."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Kode Pos"
              required
              value={kodePos}
              onChange={(v) => setKodePos(v.replace(/\D/g, '').slice(0, 5))}
              maxLength={5}
              placeholder="Contoh: 12940"
            />
            <div>
              <TextField label="Koordinat GPS" required value={gps} onChange={setGps} placeholder="-6.2088, 106.8456" />
              <p className="mt-1 text-[11px] italic text-survey-g3">
                📍{' '}
                <button
                  type="button"
                  className="font-medium text-survey-blue hover:underline"
                  onClick={getGPS}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? 'Mengambil lokasi...' : 'Klik untuk ambil lokasi GPS otomatis'}
                </button>{' '}
                — atau ketik manual
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Tanggal Survey" required type="date" value={surveyDate} onChange={setSurveyDate} />
            <TextField
              label="Pelaksana Survey"
              required
              value={pelaksana}
              onChange={setPelaksana}
              placeholder="Nama yang melaksanakan survey (marketing/surveyor)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Cabang" value={marketing} onChange={setMarketing} placeholder="Nama kantor cabang" />
            <TextField
              label="Nilai Pertanggungan / TSI (Rp)"
              required
              value={groupDigits(tsi)}
              onChange={(v) => setTsi(v.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="0"
              hint="Total Sum Insured dalam Rupiah (pemisah ribuan koma)"
            />
          </div>

          <TextField label="PIC di Lokasi" value={pic} onChange={setPic} placeholder="Nama PIC yang mendampingi survey" />
        </SectionCard>
      )}

      {/* ============ STEP 1: SURVEY UMUM ============ */}
      {step === 1 && (
        <SectionCard icon="compass" title="Survey Umum" sub="Pertanyaan dasar yang berlaku untuk semua jenis okupansi">
          {GU_GROUPS.map((group, i) => (
            <div key={group.title} className="space-y-4">
              {i > 0 && <Divider />}
              {group.title && <SubHeading>{group.title}</SubHeading>}
              {group.tip && <TipBox>{group.tip}</TipBox>}
              <FieldGrid fields={group.fields} values={general} onChange={setG} />
              {group.hint && <p className="text-[11px] italic text-survey-g3">{group.hint}</p>}
            </div>
          ))}
        </SectionCard>
      )}

      {/* ============ STEP 2: KHUSUS OKUPANSI ============ */}
      {step === 2 && (
        <SectionCard icon="target" title="Survey Khusus Okupansi" sub="Pertanyaan tambahan yang menyesuaikan jenis usaha/okupansi objek">
          <SelectField
            label="Pilih Kategori Okupansi"
            required
            value={spJenis}
            onChange={setSpJenis}
            placeholder="— pilih kategori —"
            options={Object.entries(OCC_BLOCKS).map(([key, b]) => ({ value: key, label: b.label }))}
            hint="Pertanyaan di bawah akan otomatis menyesuaikan dengan pilihan ini. Commercial mencakup Perkantoran, Restoran/Mall, Hotel, Rumah Sakit, Apartemen, dan Data Center."
          />
          <Divider />
          {!spBlock ? (
            <TipBox>👆 Silakan pilih kategori di atas untuk menampilkan pertanyaan khusus.</TipBox>
          ) : (
            <div className="space-y-4">
              <SubHeading>Pertanyaan Khusus {spBlock.label}</SubHeading>
              {spBlock.tip && <TipBox tone="warn">{spBlock.tip}</TipBox>}
              <FieldGrid fields={spBlock.fields} values={special} onChange={setS} />
              {showTbPhotos && (
                <div className="mt-2 rounded-xl border-[1.5px] border-survey-g2 bg-survey-g1 p-4">
                  <SubHeading>📷 Foto Checklist Gudang Tembakau (8.1–8.4)</SubHeading>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {TB_PHOTO_FIELDS.map((field) => (
                      <UploadField
                        key={field.key}
                        label={field.label}
                        accept="image/*"
                        multiple={false}
                        hint="Foto akan tersimpan sebagai lampiran dengan penanda nomor butir."
                        files={tbFotos[field.key]}
                        onAdd={(files) =>
                          setTbFotos((prev) => ({ ...prev, [field.key]: [...prev[field.key], ...files] }))
                        }
                        onRemove={(index) =>
                          setTbFotos((prev) => ({
                            ...prev,
                            [field.key]: prev[field.key].filter((_, i) => i !== index),
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* ============ STEP: UPLOAD DOKUMEN ============ */}
      {step === IDX.upload && (
        <SectionCard icon="paperclip" tone="orange" title="Upload Dokumen & Foto" sub="Lampiran pendukung hasil survey lapangan">
          <TipBox>
            📌 Prototipe ini menampilkan pratinjau file di browser. Untuk versi produksi, file perlu diunggah ke
            server/cloud storage — ini bagian yang perlu didiskusikan arsitekturnya dengan tim IT.
          </TipBox>
          {UPLOAD_BUCKETS.map((bucket, i) => (
            <div key={bucket.key} className="space-y-2">
              {i > 0 && <Divider />}
              <SubHeading>{bucket.label}</SubHeading>
              <UploadField
                label={bucket.fieldLabel}
                accept={bucket.accept}
                hint={bucket.hint}
                multiple={bucket.multiple}
                files={uploads[bucket.key as UploadBucketKey]}
                onAdd={(files) => addFiles(bucket.key as UploadBucketKey, files)}
                onRemove={(index) => removeFile(bucket.key as UploadBucketKey, index)}
              />
            </div>
          ))}
          <TextAreaField
            label="Catatan Terkait Dokumen / Foto"
            value={upNotes}
            onChange={setUpNotes}
            rows={2}
            placeholder="Contoh: foto ruang genset belum tersedia, menyusul dari PIC lokasi..."
          />
        </SectionCard>
      )}

      {/* ============ STEP: MANAGEMENT ============ */}
      {step === IDX.management && (
        <SectionCard icon="briefcase" title="Management" sub="Penilaian manajemen risiko — Bobot Kategori I | Max: Good (8)">
          <TipBox>
            📌 Checklist kondisi yang <b>terpenuhi</b> saat survey. Lebih banyak terpenuhi = rating lebih baik.
          </TipBox>
          <div className="space-y-2">
            {M_CHECKLIST_ITEMS.map((item) => (
              <YNRow
                key={item.id}
                name={item.id}
                label={item.label}
                required
                value={gi.mAnswers[item.id] ?? ''}
                onChange={(v) => setMAnswer(item.id, v as 'yes' | 'no')}
              />
            ))}
          </div>
          <Divider />
          <div className="space-y-4 rounded-xl border-[1.5px] border-survey-g2 bg-survey-g1 p-4">
            <SubHeading>Riwayat Klaim & Kerugian — 5 Tahun Terakhir</SubHeading>
            <ChoiceGroup
              label="Jumlah klaim dalam 5 tahun terakhir"
              required
              value={gi.mKlaim}
              onChange={(v) => setGI('mKlaim', v as GradeInputs['mKlaim'])}
              cols={3}
              options={M_KLAIM_OPTIONS}
            />
            <div>
              <span className={LABEL_CLASS}>
                Detail kerugian / klaim <span className="italic">(bisa tambah lebih dari satu kejadian)</span>
              </span>
              <div className="hidden grid-cols-[1fr_1fr_1.6fr_1fr_auto] gap-2 px-2 pb-1 text-[10.5px] font-bold text-survey-g3 sm:grid">
                <div>Kategori</div>
                <div>Date of Loss</div>
                <div>Cause of Loss</div>
                <div>Amount of Loss</div>
                <div />
              </div>
              <div className="space-y-2">
                {lossRows.map((row) => (
                  <div key={row.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1.6fr_1fr_auto]">
                    <select
                      className={FIELD_CLASS}
                      value={row.kategori}
                      onChange={(e) => updateLossRow(row.id, { kategori: e.target.value })}
                    >
                      <option value="">Kategori</option>
                      {LOSS_KATEGORI_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className={FIELD_CLASS}
                      value={row.tanggal}
                      title="Date of Loss"
                      onChange={(e) => updateLossRow(row.id, { tanggal: e.target.value })}
                    />
                    <input
                      type="text"
                      className={FIELD_CLASS}
                      placeholder="Cause of Loss"
                      value={row.cause}
                      onChange={(e) => updateLossRow(row.id, { cause: e.target.value })}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      className={FIELD_CLASS}
                      title="Amount of Loss"
                      placeholder="Amount of Loss (Rp)"
                      value={groupDigits(row.amount)}
                      onChange={(e) => updateLossRow(row.id, { amount: e.target.value.replace(/\D/g, '') })}
                    />
                    <button
                      type="button"
                      onClick={() => removeLossRow(row.id)}
                      className="rounded-lg border-[1.5px] border-survey-g2 px-3 py-2 text-sm font-bold text-survey-red transition-colors hover:bg-survey-lred"
                      title="Hapus baris"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addLossRow}
                className="mt-2 rounded-lg border-[1.5px] border-dashed border-survey-blue px-4 py-2 text-xs font-semibold text-survey-blue transition-colors hover:bg-survey-llblue"
              >
                + Tambah Kerugian
              </button>
            </div>
            <ChoiceGroup
              label="Risk improvement atas klaim sebelumnya"
              required={gi.mKlaim !== '' && gi.mKlaim !== '0'}
              hint={gi.mKlaim !== '0' ? '(wajib jika ada klaim)' : undefined}
              value={gi.mImprovement}
              onChange={(v) => setGI('mImprovement', v as GradeInputs['mImprovement'])}
              cols={2}
              options={M_IMPROVEMENT_OPTIONS}
            />
            <TextAreaField
              label="Ringkasan Kejadian & Tindak Lanjut / Perbaikan yang Dilakukan"
              value={claimRingkasan}
              onChange={setClaimRingkasan}
              rows={2}
              placeholder="Ceritakan singkat kejadian dan langkah perbaikan (risk improvement) yang sudah dilakukan..."
            />
          </div>
          <ChoiceGroup
            label="> 50% rekomendasi Aswata telah dijalankan?"
            required
            value={gi.mRekomendasi}
            onChange={(v) => setGI('mRekomendasi', v as GradeInputs['mRekomendasi'])}
            cols={2}
            options={M_REKOMENDASI_OPTIONS}
          />
          <TextAreaField
            label="Catatan Management"
            value={gradeNotes.management ?? ''}
            onChange={(v) => setGradeNotes((p) => ({ ...p, management: v }))}
            rows={2}
            placeholder="Catatan tambahan terkait manajemen risiko..."
          />
        </SectionCard>
      )}

      {/* ============ STEP: CONSTRUCTION ============ */}
      {step === IDX.construction && (
        <SectionCard icon="construction" title="Construction" sub="Penilaian konstruksi bangunan — Bobot Kategori I">
          <ChoiceGroup
            label="Kelas Konstruksi Bangunan"
            required
            value={gi.cKelas}
            onChange={(v) => setGI('cKelas', v as GradeInputs['cKelas'])}
            cols={2}
            options={C_KELAS_OPTIONS}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Jumlah Lantai"
              required
              type="number"
              min={1}
              value={special.c_lantai ?? ''}
              onChange={(v) => setS('c_lantai', v)}
              placeholder="Jumlah lantai"
              hint="Bangunan > 6 lantai = High Rise, checklist tambahan diperlukan"
            />
            <TextField
              label="Luas Bangunan (m²)"
              type="number"
              min={0}
              value={special.c_luas ?? ''}
              onChange={(v) => setS('c_luas', v)}
              placeholder="Luas total"
            />
          </div>
          <TextField
            label="Tahun Dibangun"
            type="number"
            value={special.c_tahun ?? ''}
            onChange={(v) => setS('c_tahun', v)}
            placeholder="Contoh: 2010"
          />
          <ChoiceGroup
            label="Apakah menggunakan Combustible Sandwich Panel > 30% floor area?"
            required
            value={gi.cSandwich}
            onChange={(v) => setGI('cSandwich', v as GradeInputs['cSandwich'])}
            cols={2}
            options={C_PENALTY_OPTIONS}
          />
          <ChoiceGroup
            label="Apakah menggunakan Combustible ACP (Aluminium Composite Panel) > 30% surface area?"
            required
            value={gi.cAcp}
            onChange={(v) => setGI('cAcp', v as GradeInputs['cAcp'])}
            cols={2}
            options={C_PENALTY_OPTIONS}
          />
          <TextAreaField
            label="Catatan Konstruksi"
            value={gradeNotes.construction ?? ''}
            onChange={(v) => setGradeNotes((p) => ({ ...p, construction: v }))}
            rows={2}
            placeholder="Catatan kondisi bangunan, kerusakan, atau hal penting lainnya..."
          />
        </SectionCard>
      )}

      {/* ============ STEP: OCCUPANCY ============ */}
      {step === IDX.occupancy && (
        <SectionCard icon="factory" title="Occupancy" sub="Penilaian aktivitas di lokasi risiko — Bobot Kategori I">
          <OccupationBreakdownSelect required value={occItem} onChange={setOccItem} />
          <div>
            <span className={LABEL_CLASS}>Kategori Hazard Risk Okupansi</span>
            <div className="rounded-xl border-[1.5px] border-survey-g2 bg-survey-g1 px-4 py-3.5">
              <div className="text-[13px] font-bold text-survey-navy">
                {occItem ? occItem.riskLabel : '— Pilih Breakdown Okupansi di atas —'}
              </div>
              {occItem && (
                <div className="mt-1 text-[11px] text-survey-g3">
                  Kode {occItem.code} — Skor {occItem.score} ({occItem.rating}) — terisi otomatis dari Breakdown ASWATA
                </div>
              )}
            </div>
          </div>
          <TextAreaField
            label="Deskripsi aktivitas utama di lokasi"
            required
            value={occupancyDesc}
            onChange={setOccupancyDesc}
            placeholder="Jelaskan aktivitas utama, proses produksi, jenis stok/inventori, dll."
          />
          <ChoiceGroup
            label="Penyimpanan / penggunaan bahan kimia berbahaya"
            value={special.o_kimia ?? ''}
            onChange={(v) => setS('o_kimia', v)}
            cols={3}
            options={O_KIMIA_OPTIONS}
          />
        </SectionCard>
      )}

      {/* ============ STEP: PROTECTION ============ */}
      {step === IDX.protection && (
        <SectionCard
          icon="flame"
          tone="red"
          title="Protection — Proteksi Kebakaran"
          sub="Ketersediaan dan kondisi sistem proteksi kebakaran — Bobot Kategori I"
        >
          <TipBox>📌 Penilaian berdasarkan ketersediaan DAN kondisi fungsional. Alat yang ada tapi tidak berfungsi = penalti turun 1 tingkat.</TipBox>
          <div className="rounded-xl bg-survey-g1 px-4 py-3 text-xs">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>📂 <b>Kategori Risiko:</b> {occItem ? occItem.riskLabel : '— pilih dulu di langkah Occupancy —'}</div>
              <div>💰 <b>TSI:</b> {tsi ? formatRp(tsi) : '— isi dulu di Info Umum —'}</div>
            </div>
          </div>
          <details className="rounded-lg border border-survey-g2 bg-survey-g1 px-3 py-2.5">
            <summary className="cursor-pointer text-xs font-bold text-survey-navy">Referensi syarat wajib Hydrant</summary>
            <div className="mt-2.5 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-[11px]">
                <thead>
                  <tr className="text-left">
                    <th className="border border-survey-g2 px-2 py-1.5">Risk Level Category</th>
                    <th className="border border-survey-g2 px-2 py-1.5">Kondisi</th>
                    <th className="border border-survey-g2 px-2 py-1.5">TSI ambang</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">Energy Hazard Risk</td><td className="border border-survey-g2 px-2 py-1.5" rowSpan={7}>Waktu respons pemadam kebakaran publik &gt; 30 menit</td><td className="border border-survey-g2 px-2 py-1.5">Rp 50 miliar</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">High Hazard Risk</td><td className="border border-survey-g2 px-2 py-1.5">Rp 50 miliar</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">Medium Hazard Risk 3 (Flammable)</td><td className="border border-survey-g2 px-2 py-1.5">Rp 50 miliar</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">Medium Hazard Risk 2</td><td className="border border-survey-g2 px-2 py-1.5">Rp 75 miliar</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">Medium Hazard Risk 1</td><td className="border border-survey-g2 px-2 py-1.5">Rp 75 miliar</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">Low Hazard Risk (Industrial Risk-Others)</td><td className="border border-survey-g2 px-2 py-1.5">Rp 75 miliar</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">Low Hazard Risk (Industrial Risk-Non Hazardous)</td><td className="border border-survey-g2 px-2 py-1.5">Rp 100 miliar</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">Commercial / Residential Risk</td><td className="border border-survey-g2 px-2 py-1.5">≥ 6 lantai: wajib tanpa melihat waktu respons. Selain itu, ≥ 4 lantai <b>atau</b> konstruksi combustible Class 2/3: wajib bila waktu respons &gt; 30 menit.</td><td className="border border-survey-g2 px-2 py-1.5">&gt;= 100M</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] italic text-survey-g3">
              Jika Hydrant wajib tetapi tidak tersedia, skor Hydrant otomatis 2 (Poor) dan overall Protection menjadi Poor.
            </p>
          </details>
          <ChoiceGroup
            label="APAR — Alat Pemadam Api Ringan"
            hint="(Bobot 25%)"
            required
            value={gi.pApar}
            onChange={(v) => setGI('pApar', v as GradeInputs['pApar'])}
            cols={3}
            options={P_APAR_OPTIONS}
          />
          <div>
            {hidranStatus.wajib && (
              <div className="mb-2.5 rounded-lg border-[1.5px] border-survey-red bg-survey-lred px-3.5 py-2.5 text-[11px] leading-relaxed text-survey-red">
                🚩 <b>Hidran WAJIB</b> — kriteria wajib hydrant terpenuhi:
                <div className="mt-1.5">
                  {hidranStatus.alasan.map((a) => (
                    <div key={a}>✓ {a}</div>
                  ))}
                </div>
              </div>
            )}
            <ChoiceGroup
              label="Hidran — Unit Boks / Pillar Hidran"
              hint={
                lockHidran
                  ? '(Bobot 30%) — 🔒 "Ada & Fungsional" terkunci karena ada pertanyaan lanjutan yang dijawab Tidak / Tidak Tahu.'
                  : '(Bobot 30%)'
              }
              required
              value={gi.pHidran}
              onChange={(v) => setGI('pHidran', v as GradeInputs['pHidran'])}
              cols={3}
              options={P_HIDRAN_OPTIONS}
              disabledValues={lockHidran ? ['good'] : undefined}
              disabledTitle="Ada & Fungsional terkunci karena ada pertanyaan lanjutan yang dijawab Tidak / Tidak Tahu."
            />
            {hidranStatus.wajib && gi.pHidran === 'none' && (
              <div className="mt-2 rounded-lg border-[1.5px] border-survey-red bg-survey-lred px-3.5 py-2.5 text-[11px] font-semibold text-survey-red">
                🚩 <b>Hidran wajib tidak terpenuhi</b> — skor otomatis Poor (2) dan rating akhir Protection menjadi Poor.
              </div>
            )}
            {(gi.pHidran === 'good' || gi.pHidran === 'avg') && (
              <div className="mt-3 rounded-lg border-[1.5px] border-survey-g2 bg-survey-g1 p-4">
                <SubHeading>Detail tambahan Hidran</SubHeading>
                <div className="mt-3">
                  <FieldGrid fields={HIDRAN_DETAIL_FIELDS} values={special} onChange={setS} />
                </div>
              </div>
            )}
          </div>
          <div>
            <ChoiceGroup
              label="Detektor Kebakaran Otomatis"
              hint={
                lockDetektor
                  ? '(Bobot 25% — Smoke/Heat/Flame Detector) — 🔒 "Ada & Fungsional" terkunci karena ada pertanyaan lanjutan yang dijawab Tidak / Tidak Tahu.'
                  : '(Bobot 25% — Smoke/Heat/Flame Detector)'
              }
              required
              value={gi.pDetektor}
              onChange={(v) => setGI('pDetektor', v as GradeInputs['pDetektor'])}
              cols={3}
              options={P_COMPONENT_OPTIONS}
              disabledValues={lockDetektor ? ['good'] : undefined}
              disabledTitle="Ada & Fungsional terkunci karena ada pertanyaan lanjutan yang dijawab Tidak / Tidak Tahu."
            />
            {(gi.pDetektor === 'good' || gi.pDetektor === 'avg') && (
              <div className="mt-3 rounded-lg border-[1.5px] border-survey-g2 bg-survey-g1 p-4">
                <SubHeading>Detail tambahan Detektor Kebakaran Otomatis</SubHeading>
                <div className="mt-3">
                  <FieldGrid fields={DETEKTOR_DETAIL_FIELDS} values={special} onChange={setS} />
                </div>
              </div>
            )}
          </div>
          <div>
            <ChoiceGroup
              label="Sprinkler"
              hint={
                lockSprinkler
                  ? '(Bobot 10%) — 🔒 "Ada & Fungsional" terkunci karena ada pertanyaan lanjutan yang dijawab Tidak / Tidak Tahu.'
                  : '(Bobot 10%)'
              }
              required
              value={gi.pSprinkler}
              onChange={(v) => setGI('pSprinkler', v as GradeInputs['pSprinkler'])}
              cols={3}
              options={P_COMPONENT_OPTIONS}
              disabledValues={lockSprinkler ? ['good'] : undefined}
              disabledTitle="Ada & Fungsional terkunci karena ada pertanyaan lanjutan yang dijawab Tidak / Tidak Tahu."
            />
            {(gi.pSprinkler === 'good' || gi.pSprinkler === 'avg') && (
              <div className="mt-3 rounded-lg border-[1.5px] border-survey-g2 bg-survey-g1 p-4">
                <SubHeading>Detail tambahan Sprinkler</SubHeading>
                <div className="mt-3">
                  <FieldGrid fields={SPRINKLER_DETAIL_FIELDS} values={special} onChange={setS} />
                </div>
              </div>
            )}
          </div>
          <ChoiceGroup
            label="Pemadam Kebakaran Publik — Estimasi Respons Time"
            hint="(Bobot 10%)"
            required
            value={gi.pDamkar}
            onChange={(v) => setGI('pDamkar', v as GradeInputs['pDamkar'])}
            cols={2}
            options={P_DAMKAR_OPTIONS}
          />
          <TextAreaField
            label="Keterangan tambahan terkait proteksi kebakaran"
            value={gradeNotes.protection ?? ''}
            onChange={(v) => setGradeNotes((p) => ({ ...p, protection: v }))}
            rows={2}
            placeholder="Keterangan tambahan terkait APAR, hidran, detektor, sprinkler, atau rekomendasi perbaikan..."
          />
        </SectionCard>
      )}

      {/* ============ STEP: EXPOSURE ============ */}
      {step === IDX.exposure && (
        <SectionCard
          icon="globe"
          tone="navy2"
          title="Exposure"
          sub="Penilaian eksposur dari lingkungan sekitar — Bobot Kategori II | Max: Good (4)"
        >
          <ChoiceGroup
            label="Kondisi fasilitas di sekitar bangunan tertanggung"
            required
            value={gi.exKondisi}
            onChange={(v) => setGI('exKondisi', v as GradeInputs['exKondisi'])}
            cols={1}
            options={EX_KONDISI_OPTIONS}
          />
          <details className="rounded-lg border border-survey-g2 bg-survey-g1 px-3 py-2.5">
            <summary className="cursor-pointer text-xs font-bold text-survey-navy">Referensi kriteria jarak minimum fasilitas sekitar</summary>
            <div className="mt-2.5 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-[11px]">
                <thead>
                  <tr className="text-left">
                    <th className="border border-survey-g2 px-2 py-1.5">Jenis Risiko</th>
                    <th className="border border-survey-g2 px-2 py-1.5">Tinggi Bangunan</th>
                    <th className="border border-survey-g2 px-2 py-1.5">Jarak Minimum</th>
                    <th className="border border-survey-g2 px-2 py-1.5">Contoh</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-survey-g2 px-2 py-1.5" rowSpan={4}><b>Non Industrial dan bersifat Non Komersil</b></td><td className="border border-survey-g2 px-2 py-1.5">s/d 9 m</td><td className="border border-survey-g2 px-2 py-1.5">5 m</td><td className="border border-survey-g2 px-2 py-1.5" rowSpan={4}>Rumah tinggal, asrama, rumah yatim, sekolah, perguruan tinggi, rumah sakit, klinik, rumah ibadah, museum, public building milik pemerintah, bangunan non-profit</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">&gt; 9 m s/d 14 m</td><td className="border border-survey-g2 px-2 py-1.5">&gt; 5 m s/d 7,5 m</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">&gt; 14 m s/d 40 m</td><td className="border border-survey-g2 px-2 py-1.5">&gt; 7,5 m s/d 10 m</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">&gt; 40 m</td><td className="border border-survey-g2 px-2 py-1.5">&gt; 10 m</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5" rowSpan={4}><b>Industrial dan non-industrial bersifat Komersil</b></td><td className="border border-survey-g2 px-2 py-1.5">s/d 9 m</td><td className="border border-survey-g2 px-2 py-1.5">7,5 m</td><td className="border border-survey-g2 px-2 py-1.5" rowSpan={4}>Kantor, ruko, rukan, mall, dan sejenisnya</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">&gt; 9 m s/d 14 m</td><td className="border border-survey-g2 px-2 py-1.5">&gt; 7,5 m s/d 10 m</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">&gt; 14 m s/d 40 m</td><td className="border border-survey-g2 px-2 py-1.5">&gt; 10 m s/d 15 m</td></tr>
                  <tr><td className="border border-survey-g2 px-2 py-1.5">&gt; 40 m</td><td className="border border-survey-g2 px-2 py-1.5">&gt; 15 m</td></tr>
                </tbody>
              </table>
            </div>
          </details>
          <TextAreaField
            label="Deskripsi fasilitas / bangunan di sekitar"
            value={gradeNotes.exposure ?? ''}
            onChange={(v) => setGradeNotes((p) => ({ ...p, exposure: v }))}
            placeholder="Contoh: Di sebelah kiri ada SPBU berjarak ±50m, sebelah kanan gudang cat berjarak ±20m..."
          />
          <Divider />
          <div>
            <SubHeading>
              Jarak ke Fasilitas Terdekat (Berisiko){' '}
              <span className="rounded-full bg-survey-lgreen px-2 py-[2px] text-[10px] font-bold text-survey-green">🟢 Divalidasi Pak Nuklin</span>
            </SubHeading>
            <div className="mt-3 space-y-2">
              {facilities.map((row) => (
                <div key={row.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                  <input
                    type="text"
                    className={FIELD_CLASS}
                    placeholder="Nama fasilitas (contoh: SPBU, gudang cat)"
                    value={row.nama}
                    onChange={(e) => updateFacilityRow(row.id, { nama: e.target.value })}
                  />
                  <select
                    className={FIELD_CLASS}
                    value={row.arah}
                    onChange={(e) => updateFacilityRow(row.id, { arah: e.target.value })}
                  >
                    <option value="">Arah</option>
                    {ARAH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className={FIELD_CLASS}
                    placeholder="Jarak (meter)"
                    value={row.jarak}
                    onChange={(e) => updateFacilityRow(row.id, { jarak: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeFacilityRow(row.id)}
                    className="rounded-lg border-[1.5px] border-survey-g2 px-3 py-2 text-sm font-bold text-survey-red transition-colors hover:bg-survey-lred"
                    title="Hapus baris"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addFacilityRow}
              className="mt-2 rounded-lg border-[1.5px] border-dashed border-survey-blue px-4 py-2 text-xs font-semibold text-survey-blue transition-colors hover:bg-survey-llblue"
            >
              + Tambah Fasilitas
            </button>
          </div>
        </SectionCard>
      )}

      {/* ============ STEP: NATURAL HAZARDS (revisi: Gempa + Banjir + Petir) ============ */}
      {step === IDX.nh && (
        <SectionCard
          icon="volcano"
          tone="navy2"
          title="Natural Hazards"
          sub="Kombinasi eksposur Gempa, Banjir, dan Petir — overall Marginal bila salah satu Marginal"
        >
          <TipBox>
            📌 Penilaian Natural Hazards mengikuti kombinasi <b>Gempa + Banjir + Petir</b>. Jika salah satu komponen
            berstatus Marginal, rating overall Natural Hazards menjadi <b>Marginal</b>.
          </TipBox>
          <div>
            <label className={LABEL_CLASS}>
              Gempa — Tarif & Zona Gempa OJK
              <Req />
            </label>
            <input
              type="text"
              readOnly
              className={`${FIELD_CLASS} cursor-not-allowed bg-survey-g1`}
              placeholder="Otomatis dari Kabupaten / Kota pada Info Umum"
              value={gempaZone ? `Zona ${gempaZone} — ${gempaZone === '5' ? 'Marginal' : 'Average'}` : ''}
            />
            <p className="mt-1 text-[11px] italic text-survey-g3">
              Zona diisi otomatis berdasarkan Kabupaten/Kota sesuai Tabel III.D SEOJK No. 6/SEOJK.05/2017.
            </p>
          </div>
          <div>
            <span className={LABEL_CLASS}>
              Banjir — seluruh kriteria berikut harus dijawab; semuanya harus “Ya” untuk rating Average
              <Req />
            </span>
            <div className="space-y-2">
              {NH_FLOOD_CRITERIA.map((c) => (
                <YNRow
                  key={c.key}
                  name={`nh_${c.key}`}
                  label={c.label}
                  required
                  value={nhFlood[c.key] ?? ''}
                  onChange={(v) => setNhFlood((prev) => ({ ...prev, [c.key]: v }))}
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] italic text-survey-g3">
              Average hanya jika kelima kriteria dijawab “Ya”; jika ada jawaban “Tidak”, rating Banjir = Marginal.
            </p>
          </div>
          <ChoiceGroup
            label="Petir — Penangkal Petir"
            required
            value={gi.nhPetir}
            onChange={(v) => setGI('nhPetir', v as GradeInputs['nhPetir'])}
            cols={2}
            options={NH_PETIR_OPTIONS}
          />
          <div className={`rounded-lg border-[0.5px] px-3.5 py-2.5 text-[11px] leading-relaxed ${nhOverall === 'Marginal' ? 'border-survey-orange bg-survey-lorng text-[#412402]' : 'border-survey-blue bg-survey-llblue text-survey-navy2'}`}>
            Overall Natural Hazards:{' '}
            <b>{nhOverall || '— lengkapi data Gempa, Banjir, dan Petir —'}</b>
            <div className="mt-1">
              Gempa: {effGempa === 'avg' ? 'Average' : effGempa === 'marg' ? 'Marginal' : '—'} | Banjir:{' '}
              {effBanjir === 'avg' ? 'Average' : effBanjir === 'marg' ? 'Marginal' : '—'} | Petir:{' '}
              {gi.nhPetir === 'avg' ? 'Average' : gi.nhPetir === 'marg' ? 'Marginal' : '—'}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ============ STEP: LOSS ESTIMATE (revisi: Pemisah + Jumlah Bangunan) ============ */}
      {step === IDX.loss && (
        <SectionCard
          icon="coins"
          title="Loss Estimate & Other Perils"
          sub="Estimasi kerugian maksimal & risiko khusus lainnya — Bobot Kategori III & II"
        >
          <div className="space-y-2">
            <ChoiceGroup
              label="Ada Pemisah Antar Bangunan (Fire Wall / Jarak Aman)?"
              hint="🚧 Format penilaian & kriteria pemisah bangunan masih TBC — sementara diisi ketersediaan saja."
              value={gi.lePemisah}
              onChange={(v) => setGI('lePemisah', v as GradeInputs['lePemisah'])}
              cols={2}
              options={LE_PEMISAH_OPTIONS}
            />
          </div>
          <Divider />
          <div className="space-y-2">
            <div>
              <ChoiceGroup
                label="Jumlah Bangunan"
                required
                value={gi.leJmlBangunan}
                onChange={(v) => setGI('leJmlBangunan', v as GradeInputs['leJmlBangunan'])}
                cols={2}
                options={LE_JML_BANGUNAN_OPTIONS}
              />
              {gi.leJmlBangunan === 'gt1' && (
                <div className="mt-2 rounded-lg border-[0.5px] border-survey-orange bg-survey-lorng px-3.5 py-2.5 text-[11px] text-[#412402]">
                  📌 <b>MFL should refer to Risk Engineering HO</b> — karena bangunan lebih dari 1, estimasi MFL perlu
                  dikonfirmasi ke Risk Engineering Head Office.
                </div>
              )}
            </div>
            <TipBox>💡 MFL = estimasi kerugian properti jika terjadi kebakaran besar. Untuk saat ini, penilaian disederhanakan berdasarkan jumlah bangunan — semua jawaban memicu rating Marginal.</TipBox>
          </div>
          <Divider />
          <ChoiceGroup
            label="Other Perils — Apakah ada risiko khusus lain?"
            required
            value={special.op_ada ?? 'no'}
            onChange={(v) => setS('op_ada', v)}
            cols={2}
            options={OP_ADA_OPTIONS}
          />
          {special.op_ada === 'yes' && (
            <TextAreaField
              label="Jika ada, jelaskan risiko khusus tersebut"
              value={gradeNotes.other_peril ?? ''}
              onChange={(v) => setGradeNotes((p) => ({ ...p, other_peril: v }))}
              rows={2}
              placeholder="Deskripsi risiko khusus lainnya..."
            />
          )}
          <Divider />
          <TextAreaField
            label="Catatan tambahan surveyor"
            value={gradeNotes.loss_estimate ?? ''}
            onChange={(v) => setGradeNotes((p) => ({ ...p, loss_estimate: v }))}
            rows={2}
            placeholder="Rekomendasi perbaikan, temuan penting, hal-hal yang perlu diperhatikan underwriter..."
          />
          <TextAreaField
            label="Catatan akhir surveyor (keseluruhan)"
            value={finalNotes}
            onChange={setFinalNotes}
            rows={2}
            placeholder="Catatan umum untuk hasil survey ini..."
          />
        </SectionCard>
      )}

      {/* ============ STEP: HASIL ============ */}
      {step === IDX.hasil && (
        <div className="space-y-5" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionCard icon="chart" tone="green" title="Hasil Risk Grading" sub="Kalkulasi otomatis berdasarkan input surveyor">
            <ResultCard result={gradeResult} ownerName={tertanggung} surveyDate={surveyDate} />
            <TipBox>
              <b>Skala Penilaian:</b>
              <br />
              46–55 poin = <b>GOOD</b> ✅ | 31–45 poin = <b>AVERAGE</b> ⚠️ | 21–30 poin = <b>MARGINAL</b> 🔴 | ≤ 20 poin = <b>POOR</b> ❌
            </TipBox>
            <div className="flex flex-wrap justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  printGeneratedDoc(
                    buildSurveyReportHtml(buildReportInput()),
                    `Laporan_Survey_${reportFileSuffix(tertanggung)}`,
                  )
                }
                className="rounded-lg bg-survey-navy px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-survey-navy2 sm:px-7"
              >
                📕 Unduh Survey Report (PDF)
              </button>
              <button
                type="button"
                onClick={() =>
                  printGeneratedDoc(
                    buildRiskGradingHtml(buildReportInput()),
                    `Risk_Grading_${reportFileSuffix(tertanggung)}`,
                  )
                }
                className="rounded-lg bg-survey-navy px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-survey-navy2 sm:px-7"
              >
                📊 Unduh Risk Grading (PDF)
              </button>
            </div>
          </SectionCard>

          <SectionCard icon="list" title="Ringkasan Isian" sub="Periksa kembali data sebelum mengirim">
            <dl className="space-y-1 text-sm">
              <SummaryRow label="Tertanggung" value={tertanggung} />
              <SummaryRow label="Merk" value={merk} />
              <SummaryRow label="Alamat" value={alamat} />
              <SummaryRow label="Kabupaten / Kota" value={kota} />
              <SummaryRow label="Kode Pos" value={kodePos} />
              <SummaryRow label="GPS" value={gps} />
              <SummaryRow label="Breakdown Okupansi ASWATA" value={occItem ? `${occItem.code} — ${occItem.description}` : ''} />
              <SummaryRow label="Zona Gempa OJK" value={gempaZone ? `Zona ${gempaZone}` : ''} />
              <SummaryRow label="Jenis Usaha (khusus)" value={spBlock?.label} />
              <SummaryRow label="TSI" value={formatRp(tsi)} />
              <SummaryRow label="PIC di Lokasi" value={pic} />
              <SummaryRow label="Catatan Dokumen" value={upNotes} />
            </dl>
          </SectionCard>

          <TipBox tone="warn">
            ⚠️ Hasil grading ini tersimpan otomatis sebagai penilaian awal surveyor. Admin tetap dapat meninjau ulang dan memberi grading resmi pada tahap review. Mirip fitur dashboard HTML prototype.
          </TipBox>
        </div>
      )}

      {/* Nav buttons (setara .btn-wrap di reff.html) + Simpan Draft */}
      <div className="flex items-center justify-between gap-2.5 pt-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="rounded-lg bg-survey-g2 px-5 py-3 text-[13px] font-semibold text-survey-dark transition-colors hover:bg-survey-g3 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-7"
            onClick={() => (step === 0 ? navigate('/surveys') : goPrev())}
            disabled={submitting}
          >
            {step === 0 ? 'Batal' : '← Sebelumnya'}
          </button>
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={submitting || draftState === 'saving'}
            className="rounded-lg border border-survey-navy/30 bg-white px-4 py-3 text-[13px] font-semibold text-survey-navy transition-colors hover:bg-survey-llblue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {draftState === 'saving' ? 'Menyimpan...' : '💾 Simpan Draft'}
          </button>
          {draftState === 'saved' && draftSavedAt && (
            <span className="text-[11px] text-slate-400">
              Tersimpan {new Date(draftSavedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {draftState === 'error' && (
            <span className="text-[11px] font-medium text-survey-red">Draft gagal disimpan</span>
          )}
        </div>
        <button
          type="button"
          className="min-w-0 flex-1 rounded-lg bg-survey-navy px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-survey-navy2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-40 sm:flex-none sm:px-7"
          onClick={() => (step === steps.length - 1 ? void submitSurvey() : goNext())}
          disabled={submitting}
        >
          {step === IDX.loss
            ? 'Lihat Hasil Risk Grading →'
            : step === steps.length - 1
              ? submitting
                ? 'Menyimpan...'
                : '✓ Kirim Survei'
              : 'Selanjutnya →'}
        </button>
      </div>
      </div>
      </>
      )}
    </>
  );
}

// ============================================================
// Reusable pieces
// ============================================================

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 border-b-[0.5px] border-survey-g2 py-1.5 last:border-0">
      <dt className="text-survey-g3">{label}</dt>
      <dd className="shrink-0 text-right font-medium text-survey-dark">{value}</dd>
    </div>
  );
}
