import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Occupation, Question } from '../api/types';
import { OccupationSearchSelect } from '../components/OccupationSearchSelect';
import { computeGradeScores, type GradeInputs } from '../shared';
import { errorMessage } from '../lib/format';
import { useAuth } from '../hooks/useAuth';
import { GU_GROUPS, OCC_BLOCKS } from '../lib/surveyForm';
import {
  C_KELAS_OPTIONS,
  C_PENALTY_OPTIONS,
  EX_KONDISI_OPTIONS,
  KATEGORI_OKUPANSI_OPTIONS,
  LE_MFL_OPTIONS,
  M_CHECKLIST_ITEMS,
  M_IMPROVEMENT_OPTIONS,
  M_KLAIM_OPTIONS,
  M_REKOMENDASI_OPTIONS,
  NH_BANJIR_OPTIONS,
  NH_GEMPA_OPTIONS,
  NH_HISTORY_OPTIONS,
  NH_LONGSOR_OPTIONS,
  NH_PETIR_OPTIONS,
  NH_TSUNAMI_OPTIONS,
  O_DAPUR_OPTIONS,
  O_FORKLIFT_OPTIONS,
  O_HAZARD_OPTIONS,
  O_KIMIA_OPTIONS,
  OP_ADA_OPTIONS,
  P_APAR_OPTIONS,
  P_COMPONENT_OPTIONS,
  P_DAMKAR_OPTIONS,
  P_HIDRAN_OPTIONS,
} from '../lib/gradeOptions';
import { ProgressSteps } from '../components/survey/ProgressSteps';
import { Divider, SectionCard, SubHeading } from '../components/survey/SectionCard';
import { FieldGrid } from '../components/survey/FieldGrid';
import { SelectField, TextAreaField, TextField } from '../components/survey/TextField';
import { ChoiceGroup } from '../components/survey/ChoiceGroup';
import { CheckList } from '../components/survey/CheckList';
import { TipBox } from '../components/survey/TipBox';
import { UploadField } from '../components/survey/UploadField';
import { ResultCard } from '../components/survey/ResultCard';
import { FIELD_CLASS, LABEL_CLASS } from '../components/survey/tokens';
import { Req } from '../components/survey/SectionCard';

// ============================================================
// Wizard 12 langkah — port 1:1 dari apps/api/data/reff.html
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

const UPLOAD_BUCKETS = [
  {
    key: 'foto',
    label: '📷 Foto Bangunan',
    fieldLabel: 'Tampak Depan, Samping, Dalam, dll.',
    hint: 'Bisa pilih beberapa foto sekaligus',
    accept: 'image/*',
    kind: 'photo' as const,
  },
  {
    key: 'denah',
    label: '🗺️ Denah / Layout Bangunan',
    fieldLabel: 'Denah lokasi, layout gudang/pabrik, dsb.',
    hint: undefined,
    accept: 'image/*,.pdf',
    kind: 'auto' as const,
  },
  {
    key: 'legal',
    label: '📄 Dokumen Legal & Pendukung',
    fieldLabel: 'IMB/PBG, Sertifikat, Izin Usaha, Laporan Klaim Sebelumnya, dll.',
    hint: undefined,
    accept: '.pdf,.doc,.docx,image/*',
    kind: 'document' as const,
  },
];

// ---------- default grading inputs (fallback reff.html) ----------

// Semua pilihan wajib dimulai kosong ('') — surveyor harus memilih eksplisit
// sebelum boleh lanjut langkah (validasi required, lihat STEP_REQUIRED_KEYS).
type GradeInputsDraft = {
  [K in keyof GradeInputs]: GradeInputs[K] extends string ? GradeInputs[K] | '' : GradeInputs[K];
};

const DEFAULT_GRADE_INPUTS: GradeInputsDraft = {
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
  nhTsunami: '',
  nhPetir: '',
  nhBanjir: '',
  nhLongsor: '',
  nhHistory: '',
  leMfl: '',
};

type UploadBucketKey = 'foto' | 'denah' | 'legal';

export function SurveyorNewSurvey() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ---- Step 0: Info Umum ----
  const [tertanggung, setTertanggung] = useState('');
  const [merk, setMerk] = useState('');
  const [kategoriOkupansi, setKategoriOkupansi] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kota, setKota] = useState('');
  const [gps, setGps] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().slice(0, 10));
  const [marketing, setMarketing] = useState('');
  const [tsi, setTsi] = useState('');
  const [occupation, setOccupation] = useState<Occupation | null>(null);

  // ---- Step 1 & 2: jawaban umum + khusus okupansi (field descriptor-driven) ----
  const [general, setGeneral] = useState<Record<string, string>>({});
  const [spJenis, setSpJenis] = useState('');
  const [special, setSpecial] = useState<Record<string, string>>({});

  // ---- Step 3: Upload ----
  const [uploads, setUploads] = useState<Record<UploadBucketKey, File[]>>({ foto: [], denah: [], legal: [] });
  const [upNotes, setUpNotes] = useState('');

  // ---- Steps 4–10: grading inputs + catatan per section ----
  const [gi, setGi] = useState<GradeInputsDraft>(DEFAULT_GRADE_INPUTS);
  const [gradeNotes, setGradeNotes] = useState<Record<string, string>>({});
  const [lhJumlah, setLhJumlah] = useState('');
  const [lhNilai, setLhNilai] = useState('');
  const [occupancyDesc, setOccupancyDesc] = useState('');
  const [finalNotes, setFinalNotes] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Pesan requirement per langkah — terisi saat percobaan navigasi diblokir.
  const [stepError, setStepError] = useState<Record<number, string>>({});

  // Anti-duplikasi: bila survei sudah terbuat tapi sebagian lampiran gagal
  // diunggah, retry hanya mengunggah ulang lampiran (bukan membuat survei baru).
  const createdSurveyIdRef = useRef<string | null>(null);
  const uploadedKeysRef = useRef<Set<string>>(new Set());

  const gradeResult = useMemo(() => computeGradeScores(gi as GradeInputs), [gi]);

  const { data: occData } = useOccupations();
  const occupations = occData ?? [];

  // Pertanyaan dinamis dari DB (core + jalur leluhur okupasi terpilih)
  const { data: qData, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions', occupation?.id ?? ''],
    queryFn: async () => {
      const res = await api.get(`/questions?occupationId=${occupation!.id}`);
      return res.data.data.questions as Question[];
    },
    enabled: !!occupation?.id,
  });

  const qSections = useMemo(() => {
    const list: Array<{ name: string; questions: Question[] }> = [];
    for (const q of qData ?? []) {
      const last = list[list.length - 1];
      if (last && last.name === q.section) last.questions.push(q);
      else list.push({ name: q.section, questions: [q] });
    }
    return list;
  }, [qData]);

  // Step "Pertanyaan" hanya muncul bila ada kuesioner DB untuk okupasi ini
  const hasQStep = qSections.length > 0;
  const steps = useMemo(() => {
    const b = [...BASE_STEPS];
    if (hasQStep) b.splice(3, 0, 'Pertanyaan');
    return b;
  }, [hasQStep]);
  const off = hasQStep ? 1 : 0;
  const IDX = {
    upload: 3 + off,
    management: 4 + off,
    construction: 5 + off,
    occupancy: 6 + off,
    protection: 7 + off,
    exposure: 8 + off,
    nh: 9 + off,
    loss: 10 + off,
    hasil: 11 + off,
  };
  const qStepIndex = hasQStep ? 3 : -1;

  // Input grading yang wajib dipilih sebelum boleh lanjut/loncat melewati langkahnya.
  // (Di reff.html nilainya selalu punya default; di wizard surveyor memilih eksplisit.)
  const STEP_REQUIRED_KEYS: Record<number, Array<keyof GradeInputs>> = {
    [IDX.management]: ['mKlaim', 'mImprovement', 'mRekomendasi'],
    [IDX.construction]: ['cKelas'],
    [IDX.occupancy]: ['oHazard'],
    [IDX.protection]: ['pApar', 'pHidran', 'pDetektor', 'pSprinkler', 'pDamkar'],
    [IDX.exposure]: ['exKondisi'],
    [IDX.nh]: ['nhGempa', 'nhTsunami', 'nhPetir', 'nhBanjir', 'nhLongsor', 'nhHistory'],
    [IDX.loss]: ['leMfl'],
  };

  // Requirement per langkah: pesan error bila langkah belum boleh dilewati.
  const stepInvalid = useMemo(() => {
    const errors: Record<number, string> = {};
    // Step 0 — Info Umum
    const miss0: string[] = [];
    if (!tertanggung.trim()) miss0.push('Nama tertanggung');
    if (!alamat.trim()) miss0.push('Alamat risiko');
    if (!kategoriOkupansi) miss0.push('Jenis okupansi');
    if (!occupation?.id || occupations.some((o) => o.parentId === occupation.id))
      miss0.push('Kode okupasi OJK (pilih sampai level terakhir)');
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
    // Step kuesioner DB — pertanyaan wajib + format jawaban sesuai validasi API
    if (hasQStep) {
      const allQ = qSections.flatMap((s) => s.questions);
      const missing = allQ.find((q) => q.required && !(answers[q.id] ?? '').trim());
      if (missing) errors[qStepIndex] = 'Masih ada pertanyaan wajib yang belum dijawab.';
      const badNum = allQ.find(
        (q) =>
          q.answerType === 'NUMBER' &&
          (answers[q.id] ?? '').trim() !== '' &&
          !/^\d+(\.\d+)?$/.test((answers[q.id] ?? '').trim()),
      );
      if (badNum) errors[qStepIndex] = `Jawaban "${badNum.text}" harus berupa angka (contoh: 150 atau 2.5).`;
    }
    // Step grading — pilihan wajib per seksi (+ deskripsi aktivitas wajib di Occupancy)
    if (!occupancyDesc.trim()) errors[IDX.occupancy] = 'Isi deskripsi aktivitas utama di lokasi.';
    for (const [idxStr, keys] of Object.entries(STEP_REQUIRED_KEYS)) {
      const missing = (keys as Array<keyof GradeInputs>).filter((k) => String(gi[k] ?? '') === '');
      if (missing.length > 0) {
        errors[Number(idxStr)] = `Masih ada ${missing.length} pilihan wajib di seksi ini yang belum dipilih.`;
      }
    }
    return errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tertanggung, alamat, kategoriOkupansi, occupation, occupations, general, spJenis, qSections, answers, hasQStep, qStepIndex, gi, occupancyDesc]);

  function setG(key: string, v: string) {
    setGeneral((prev) => ({ ...prev, [key]: v }));
  }
  function setS(key: string, v: string) {
    setSpecial((prev) => ({ ...prev, [key]: v }));
  }
  function setAnswer(qid: string, v: string) {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  }
  function setGI<K extends keyof GradeInputs>(key: K, v: GradeInputsDraft[K]) {
    setGi((prev) => ({ ...prev, [key]: v }));
  }
  function toggleMChecklist(id: string) {
    setGi((prev) => {
      const has = prev.mChecklist.includes(id);
      return { ...prev, mChecklist: has ? prev.mChecklist.filter((x) => x !== id) : [...prev.mChecklist, id] };
    });
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
    const err = stepInvalid[step];
    if (err) {
      setStepError((prev) => ({ ...prev, [step]: err }));
      return;
    }
    setStepError((prev) => ({ ...prev, [step]: '' }));
    setStep((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goPrev() {
    setError('');
    setStepError((prev) => ({ ...prev, [step]: '' }));
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goTo(n: number) {
    setError('');
    // Blokir lompatan MAJU melewati langkah yang requirement-nya belum terpenuhi;
    // mundur ke langkah sebelumnya selalu diizinkan.
    if (n > step) {
      for (let i = step; i < n; i++) {
        if (stepInvalid[i]) {
          setStepError((prev) => ({ ...prev, [i]: stepInvalid[i] }));
          setError(`Langkah ${i + 1} (${steps[i]}) belum lengkap: ${stepInvalid[i]}`);
          return;
        }
      }
    }
    setStepError((prev) => ({ ...prev, [step]: '' }));
    setStep(n);
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
    // Semua langkah sebelum Hasil harus valid sebelum kirim.
    for (let i = 0; i < steps.length - 1; i++) {
      if (stepInvalid[i]) {
        setStepError((prev) => ({ ...prev, [i]: stepInvalid[i] }));
        setError(`Langkah ${i + 1} (${steps[i]}) belum lengkap: ${stepInvalid[i]}`);
        return;
      }
    }
    setSubmitting(true);
    try {
      // 1) Buat survey (dilewati bila retry setelah kegagalan upload lampiran)
      let surveyId = createdSurveyIdRef.current;
      if (!surveyId) {
        const res = await api.post('/surveys', {
        property: {
          name: tertanggung,
          address: alamat,
          ownerName: tertanggung,
          occupationId: occupation!.id,
          extraData: {
            merk,
            kota,
            gps,
            marketing,
            tsi: tsi === '' ? null : Number(tsi),
            kategoriOkupansi: kategoriOkupansi || null,
            jenisOkupansi: spJenis || null,
            general,
            special,
            uploadNotes: upNotes || undefined,
            occupancyDesc: occupancyDesc.trim() || undefined,
            lossHistory: { lhJumlah, lhNilai },
          },
        },
        surveyDate: surveyDate ? new Date(surveyDate).toISOString() : undefined,
        notes:
          [occupancyDesc.trim() ? `Deskripsi aktivitas utama: ${occupancyDesc.trim()}` : '', finalNotes.trim()]
            .filter(Boolean)
            .join('\n\n') || undefined,
        answers: Object.entries(answers)
          .filter(([, v]) => v.trim() !== '')
          .map(([questionId, value]) => ({ questionId, value })),
        grading: {
          inputs: gi as GradeInputs,
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
          const kind =
            bucket.kind === 'auto' ? (file.type.startsWith('image/') ? 'photo' : 'document') : bucket.kind;
          formData.append('kind', kind);
          try {
            await api.post(`/surveys/${surveyId}/attachments`, formData);
            uploadedKeysRef.current.add(uploadKey);
          } catch {
            failed.push(file.name);
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

      navigate(`/surveys/${surveyId}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const spBlock = spJenis ? OCC_BLOCKS[spJenis] : undefined;

  return (
    <>
      {/* Header ASWATA full-bleed ada di SurveyorLayout (.app-header reff.html).
          Di sini hanya strip progress navy (.progress-wrap reff.html). */}
      <ProgressSteps labels={steps} current={step} onSelect={goTo} invalidSteps={stepError} />

      <div className="mx-auto w-full max-w-[900px] px-4 py-5 pb-16 sm:px-6">
      {(error || stepError[step]) && (
        <div className="rounded-lg bg-survey-lred px-4 py-3 text-sm text-survey-red">{error || stepError[step]}</div>
      )}

      {/* ============ STEP 0: INFO UMUM ============ */}
      {step === 0 && (
        <SectionCard icon="clipboard" title="Informasi Umum Survey" sub="Data dasar objek risiko yang disurvey">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Nama Tertanggung" required value={tertanggung} onChange={setTertanggung} placeholder="PT / CV / Nama Perorangan" />
            <TextField label="Nama Komersial / Merk" value={merk} onChange={setMerk} placeholder="Nama usaha / brand" />
          </div>

          <ChoiceGroup label="Jenis Okupansi" required value={kategoriOkupansi} onChange={setKategoriOkupansi} cols={3} options={KATEGORI_OKUPANSI_OPTIONS} />

          <OccupationSearchSelect value={occupation?.id ?? ''} onChange={(o) => setOccupation(o)} requireLeaf />

          <TextAreaField label="Alamat Risiko Lengkap" required value={alamat} onChange={setAlamat} rows={3} placeholder="Jalan, nomor, kelurahan, kecamatan, kota, provinsi" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Kota / Kabupaten" value={kota} onChange={setKota} placeholder="Nama kota" />
            <div>
              <TextField label="Koordinat GPS" value={gps} readOnly placeholder="-6.2088, 106.8456" />
              <button
                type="button"
                className="mt-1 text-[11px] font-medium text-survey-blue hover:underline"
                onClick={getGPS}
                disabled={gpsLoading}
              >
                📍 {gpsLoading ? 'Mengambil lokasi...' : 'Klik untuk ambil lokasi GPS otomatis'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Tanggal Survey" required type="date" value={surveyDate} onChange={setSurveyDate} />
            <TextField label="Nama Surveyor" required value={user?.name ?? ''} readOnly />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Nama Marketing / Cabang" value={marketing} onChange={setMarketing} placeholder="Nama marketing / kantor cabang" />
            <TextField label="Nilai Pertanggungan / TSI (Rp)" type="number" min={0} value={tsi} onChange={setTsi} placeholder="0" hint="Total Sum Insured dalam Rupiah" />
          </div>
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
            label="Pilih Jenis Usaha / Okupansi Spesifik"
            required
            value={spJenis}
            onChange={setSpJenis}
            placeholder="— pilih jenis usaha —"
            options={Object.entries(OCC_BLOCKS).map(([key, b]) => ({ value: key, label: b.label }))}
            hint="Pertanyaan di bawah akan otomatis menyesuaikan dengan pilihan ini."
          />
          <Divider />
          {!spBlock ? (
            <TipBox>👆 Silakan pilih jenis usaha di atas untuk menampilkan pertanyaan khusus.</TipBox>
          ) : (
            <div className="space-y-4">
              <SubHeading>Pertanyaan Khusus {spBlock.label}</SubHeading>
              {spBlock.tip && <TipBox tone="warn">{spBlock.tip}</TipBox>}
              <FieldGrid fields={spBlock.fields} values={special} onChange={setS} />
            </div>
          )}
        </SectionCard>
      )}

      {/* ============ STEP DINAMIS: PERTANYAAN DB ============ */}
      {step === qStepIndex && (
        <SectionCard icon="list" title="Pertanyaan Survey" sub="Kuesioner dinamis untuk okupasi terpilih (dikelola admin)">
          {questionsLoading || !qData ? (
            <p className="text-xs text-survey-g3">Memuat pertanyaan...</p>
          ) : (
            qSections.map((section) => (
              <div key={section.name} className="space-y-3">
                <SubHeading>{section.name}</SubHeading>
                <div className="space-y-4">
                  {section.questions.map((q) => (
                    <QuestionInput key={q.id} q={q} value={answers[q.id] ?? ''} onChange={(v) => setAnswer(q.id, v)} />
                  ))}
                </div>
              </div>
            ))
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
          <CheckList items={M_CHECKLIST_ITEMS} checked={gi.mChecklist} onToggle={toggleMChecklist} />
          <Divider />
          <ChoiceGroup
            label="Riwayat klaim dalam 5 tahun terakhir"
            required
            value={gi.mKlaim}
            onChange={(v) => setGI('mKlaim', v as GradeInputs['mKlaim'])}
            cols={3}
            options={M_KLAIM_OPTIONS}
          />
          <ChoiceGroup
            label="Risk improvement atas klaim sebelumnya"
            required
            value={gi.mImprovement}
            onChange={(v) => setGI('mImprovement', v as GradeInputs['mImprovement'])}
            cols={2}
            options={M_IMPROVEMENT_OPTIONS}
          />
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
            value={gi.cSandwich}
            onChange={(v) => setGI('cSandwich', v as GradeInputs['cSandwich'])}
            cols={2}
            options={C_PENALTY_OPTIONS}
          />
          <ChoiceGroup
            label="Apakah menggunakan Combustible ACP (Aluminium Composite Panel) > 30% surface area?"
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
          <ChoiceGroup
            label="Kategori Hazard Risk Okupansi"
            required
            value={gi.oHazard}
            onChange={(v) => setGI('oHazard', v as GradeInputs['oHazard'])}
            cols={2}
            options={O_HAZARD_OPTIONS}
          />
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
          <ChoiceGroup
            label="Apakah ada dapur / kitchen (Restaurant, Hotel, Central Kitchen)?"
            value={special.o_dapur ?? ''}
            onChange={(v) => setS('o_dapur', v)}
            cols={2}
            options={O_DAPUR_OPTIONS}
          />
          <ChoiceGroup
            label="Apakah ada Forklift listrik yang diisi baterai di dalam gedung?"
            value={special.o_forklift ?? ''}
            onChange={(v) => setS('o_forklift', v)}
            cols={2}
            options={O_FORKLIFT_OPTIONS}
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
          <ChoiceGroup
            label="APAR — Alat Pemadam Api Ringan (Bobot 0.2)"
            required
            value={gi.pApar}
            onChange={(v) => setGI('pApar', v as GradeInputs['pApar'])}
            cols={3}
            options={P_APAR_OPTIONS}
          />
          <ChoiceGroup
            label="Hidran — Unit Boks / Pillar Hidran (Bobot 0.3)"
            required
            value={gi.pHidran}
            onChange={(v) => setGI('pHidran', v as GradeInputs['pHidran'])}
            cols={3}
            options={P_HIDRAN_OPTIONS}
          />
          <ChoiceGroup
            label="Detektor Kebakaran Otomatis (Bobot 0.25 — Smoke/Heat/Flame Detector)"
            required
            value={gi.pDetektor}
            onChange={(v) => setGI('pDetektor', v as GradeInputs['pDetektor'])}
            cols={3}
            options={P_COMPONENT_OPTIONS}
          />
          <ChoiceGroup
            label="Sprinkler (Bobot 0.15)"
            required
            value={gi.pSprinkler}
            onChange={(v) => setGI('pSprinkler', v as GradeInputs['pSprinkler'])}
            cols={3}
            options={P_COMPONENT_OPTIONS}
          />
          <ChoiceGroup
            label="Pemadam Kebakaran Publik — Estimasi Respons Time (Bobot 0.1)"
            required
            value={gi.pDamkar}
            onChange={(v) => setGI('pDamkar', v as GradeInputs['pDamkar'])}
            cols={4}
            options={P_DAMKAR_OPTIONS}
          />
          <TextAreaField
            label="Catatan kondisi proteksi kebakaran"
            value={gradeNotes.protection ?? ''}
            onChange={(v) => setGradeNotes((p) => ({ ...p, protection: v }))}
            rows={2}
            placeholder="Catatan kondisi APAR, hidran, sprinkler, atau rekomendasi perbaikan..."
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
          <TextAreaField
            label="Deskripsi fasilitas / bangunan di sekitar"
            value={gradeNotes.exposure ?? ''}
            onChange={(v) => setGradeNotes((p) => ({ ...p, exposure: v }))}
            placeholder="Contoh: Di sebelah kiri ada SPBU berjarak ±50m, sebelah kanan gudang cat berjarak ±20m..."
          />
        </SectionCard>
      )}

      {/* ============ STEP: NATURAL HAZARDS ============ */}
      {step === IDX.nh && (
        <SectionCard
          icon="volcano"
          tone="navy2"
          title="Natural Hazards"
          sub="Penilaian risiko bencana alam — Max: Average (3) | kecuali ada catatan khusus"
        >
          <TipBox>📌 Default Natural Hazards = Average. Turun menjadi Marginal/Poor jika ada kondisi yang menunjukkan risiko tinggi.</TipBox>
          <ChoiceGroup
            label="Risiko Gempa Bumi (Earthquake)"
            required
            value={gi.nhGempa}
            onChange={(v) => setGI('nhGempa', v as GradeInputs['nhGempa'])}
            cols={2}
            options={NH_GEMPA_OPTIONS}
          />
          <ChoiceGroup
            label="Risiko Tsunami"
            required
            value={gi.nhTsunami}
            onChange={(v) => setGI('nhTsunami', v as GradeInputs['nhTsunami'])}
            cols={2}
            options={NH_TSUNAMI_OPTIONS}
          />
          <ChoiceGroup
            label="Risiko Petir (Lightning)"
            required
            value={gi.nhPetir}
            onChange={(v) => setGI('nhPetir', v as GradeInputs['nhPetir'])}
            cols={3}
            options={NH_PETIR_OPTIONS}
          />
          <ChoiceGroup
            label="Risiko Banjir (Flood)"
            required
            value={gi.nhBanjir}
            onChange={(v) => setGI('nhBanjir', v as GradeInputs['nhBanjir'])}
            cols={2}
            options={NH_BANJIR_OPTIONS}
          />
          <ChoiceGroup
            label="Risiko Longsor (Landslide)"
            required
            value={gi.nhLongsor}
            onChange={(v) => setGI('nhLongsor', v as GradeInputs['nhLongsor'])}
            cols={2}
            options={NH_LONGSOR_OPTIONS}
          />
          <ChoiceGroup
            label="Riwayat Bencana Alam (NatCat Loss) di lokasi ini"
            required
            value={gi.nhHistory}
            onChange={(v) => setGI('nhHistory', v as GradeInputs['nhHistory'])}
            cols={3}
            options={NH_HISTORY_OPTIONS}
          />
        </SectionCard>
      )}

      {/* ============ STEP: LOSS ESTIMATE ============ */}
      {step === IDX.loss && (
        <SectionCard
          icon="coins"
          title="Loss Estimate & Other Perils"
          sub="Estimasi kerugian maksimal & risiko khusus lainnya — Bobot Kategori III & II"
        >
          <div className="space-y-2">
            <ChoiceGroup
              label="Estimasi Maximum Foreseeable Loss (MFL) — Property Damage"
              required
              value={gi.leMfl}
              onChange={(v) => setGI('leMfl', v as GradeInputs['leMfl'])}
              cols={2}
              options={LE_MFL_OPTIONS}
            />
            <TipBox>💡 MFL = estimasi kerugian properti jika terjadi kebakaran besar. Pertimbangkan kondisi bangunan, proteksi, dan pemisahan area.</TipBox>
          </div>
          <Divider />
          <ChoiceGroup
            label="Other Perils — Apakah ada risiko khusus lain?"
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
          <SubHeading>Riwayat Klaim (Loss History)</SubHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Jumlah klaim 5 tahun terakhir" type="number" min={0} value={lhJumlah} onChange={setLhJumlah} placeholder="0" />
            <TextField label="Total nilai klaim (Rp)" type="number" min={0} value={lhNilai} onChange={setLhNilai} placeholder="0" />
          </div>
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
        <div className="space-y-5">
          <SectionCard icon="chart" tone="green" title="Hasil Risk Grading" sub="Kalkulasi otomatis berdasarkan input surveyor">
            <ResultCard result={gradeResult} ownerName={tertanggung} surveyDate={surveyDate} />
            <TipBox>
              <b>Skala Penilaian:</b>
              <br />
              46–55 poin = <b>GOOD</b> ✅ | 31–45 poin = <b>AVERAGE</b> ⚠️ | 21–30 poin = <b>MARGINAL</b> 🔴 | ≤ 20 poin = <b>POOR</b> ❌
            </TipBox>
            <div className="flex justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-survey-navy px-7 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-survey-navy2"
              >
                🖨️ Cetak Hasil
              </button>
            </div>
          </SectionCard>

          <SectionCard icon="list" title="Ringkasan Isian" sub="Periksa kembali data sebelum mengirim">
            <dl className="space-y-1 text-sm">
              <SummaryRow label="Tertanggung" value={tertanggung} />
              <SummaryRow label="Merk" value={merk} />
              <SummaryRow label="Jenis Okupansi" value={kategoriOkupansi ? KATEGORI_OKUPANSI_OPTIONS.find((o) => o.value === kategoriOkupansi)?.label : ''} />
              <SummaryRow label="Okupasi OJK" value={occupation ? `${occupation.code} — ${occupation.name}` : ''} />
              <SummaryRow label="Alamat" value={alamat} />
              <SummaryRow label="GPS" value={gps} />
              <SummaryRow label="Jenis Usaha (khusus)" value={spBlock?.label} />
              <SummaryRow label="TSI" value={tsi ? `Rp ${Number(tsi).toLocaleString('id-ID')}` : ''} />
              <SummaryRow label="Catatan Dokumen" value={upNotes} />
            </dl>
          </SectionCard>

          <TipBox tone="warn">
            ⚠️ Hasil grading ini tersimpan otomatis sebagai penilaian awal surveyor. Admin tetap dapat meninjau ulang
            dan memberi grading resmi pada tahap review.
          </TipBox>
        </div>
      )}

      {/* Nav buttons (setara .btn-wrap di reff.html) */}
      <div className="flex items-center justify-between gap-2.5 pt-1">
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

// ============================================================
// Input pertanyaan dinamis (dari DB)
// ============================================================

function QuestionInput({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {q.text}
        {q.required && <Req />}
      </label>

      {q.answerType === 'YES_NO' && (
        <div className="grid grid-cols-2 gap-2">
          {['Ya', 'Tidak'].map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(opt)}
                className={`rounded-lg border-[1.5px] px-4 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-survey-navy bg-survey-navy text-white'
                    : 'border-survey-g2 bg-white text-survey-dark hover:border-survey-blue hover:bg-survey-llblue'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {q.answerType === 'NUMBER' && (
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          className={FIELD_CLASS}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
      )}

      {q.answerType === 'CHOICE' && (
        <select className={FIELD_CLASS} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Pilih...</option>
          {(q.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {q.answerType === 'MULTI' && (
        <div className="space-y-2">
          {(q.options ?? []).map((opt) => {
            const checked = (value ?? '').split(',').map((s) => s.trim()).includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 rounded-lg border-[1.5px] border-survey-g2 bg-white px-3 py-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-survey-green"
                  checked={checked}
                  onChange={() => {
                    const current = new Set((value ?? '').split(',').map((s) => s.trim()).filter(Boolean));
                    if (current.has(opt)) current.delete(opt);
                    else current.add(opt);
                    onChange([...current].join(', '));
                  }}
                />
                <span className="font-medium text-survey-dark">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {q.answerType === 'TEXT' && (
        <input className={FIELD_CLASS} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Isi jawaban..." />
      )}
    </div>
  );
}

// ============================================================
// Hooks
// ============================================================

function useOccupations() {
  return useQuery({
    queryKey: ['occupations'],
    queryFn: async () => {
      const res = await api.get('/occupations');
      return res.data.data.occupations as Occupation[];
    },
  });
}
