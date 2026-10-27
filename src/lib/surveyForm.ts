/**
 * Definisi field wizard survey — diselaraskan dengan prototipe
 * `src/public/Surver_Report__Revisi_Terbaru.html` (SURVEY_HTML_B64, revisi terbaru).
 *
 * Dipakai bersama oleh SurveyorNewSurvey (form input) dan SurveyDetail /
 * AdminSurveyReview / AdminReports (render ringkasan jawaban).
 */

import { DETECTOR_TYPE_OPTIONS, P_COVERAGE_OPTIONS, YA_TIDAK_OPTIONS } from './gradeOptions';

/** Kondisi tampil-sembunyi field (port logika `toggleSub` / `showWhen` di prototipe). */
export type ShowCond = {
  key: string;
  value: string | string[];
  /**
   * eq (default) — nilai persis sama dengan salah satu `value`.
   * all — nilai csv (field check) memuat SEMUA item `value`.
   * notAll — nilai csv TIDAK memuat semua item `value` (untuk peringatan otomatis).
   */
  op?: 'eq' | 'all' | 'notAll';
};

export type FieldDef = {
  key: string;
  label: string;
  /** `heading` = sub-judul; `notice` = kotak catatan/red-flag (lihat `tone`). */
  type: 'text' | 'number' | 'textarea' | 'select' | 'yesno' | 'check' | 'heading' | 'notice';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  hint?: string;
  /** 2 = ditempatkan berpasangan dalam satu baris (`.grid-2` di prototipe). */
  cols?: 1 | 2;
  /** Tampil hanya bila seluruh kondisi terpenuhi (AND). */
  showWhen?: ShowCond[];
  /** Wajib diisi selama field tampil (`.req` di prototipe). */
  required?: boolean;
  /** Hanya type `notice` — nada kotak catatan. */
  tone?: 'info' | 'warn' | 'danger';
};

export type FieldGroup = { title?: string; tip?: string; hint?: string; fields: FieldDef[] };

/** Evaluasi kondisi showWhen terhadap nilai saat ini. */
export function isFieldVisible(field: FieldDef, values: Record<string, string>): boolean {
  if (!field.showWhen || field.showWhen.length === 0) return true;
  return field.showWhen.every((cond) => {
    const raw = (values[cond.key] ?? '').trim();
    const targets = Array.isArray(cond.value) ? cond.value : [cond.value];
    if (cond.op === 'all') return targets.every((t) => raw.split(',').map((s) => s.trim()).includes(t));
    if (cond.op === 'notAll') return !targets.every((t) => raw.split(',').map((s) => s.trim()).includes(t));
    return targets.includes(raw);
  });
}

/** Field yang ikut divalidasi saat langkah dinavigasi (required + tampil). */
export function missingRequiredFields(fields: FieldDef[], values: Record<string, string>): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (!field.required) continue;
    if (field.type === 'heading' || field.type === 'notice') continue;
    if (!isFieldVisible(field, values)) continue;
    if (!(values[field.key] ?? '').trim()) missing.push(field.label);
  }
  return missing;
}

// ============================================================
// SURVEY UMUM (Section 1 prototipe — hanya grup A & B)
// ============================================================

export const GU_GROUPS: FieldGroup[] = [
  {
    title: 'A. Profil Usaha',
    fields: [
      { key: 'karyawan', label: 'Jumlah Karyawan / Tenaga Kerja', type: 'number', placeholder: 'Contoh: 56', cols: 2 },
      { key: 'tahun_berdiri', label: 'Usaha Berjalan Sejak Tahun', type: 'number', placeholder: 'Contoh: 2002', cols: 2 },
      { key: 'jam_operasional', label: 'Jam Operasional', type: 'text', placeholder: 'Contoh: 09.00 – 19.00', cols: 2 },
      { key: 'rencana', label: 'Ada Rencana Perubahan / Ekspansi ke Depan?', type: 'yesno', cols: 2 },
      { key: 'rencana_detail', label: 'Jika ada, jelaskan rencana perubahan / ekspansi', type: 'textarea', placeholder: 'Contoh: penambahan gudang baru, renovasi, pergantian mesin produksi, dll.' },
    ],
  },
  {
    title: 'B. Keamanan Lokasi',
    fields: [
      {
        key: 'keamanan',
        label: 'Fasilitas keamanan yang diterapkan',
        type: 'check',
        options: [
          { value: 'satpam', label: 'Ada penjagaan keamanan (satpam) 24 jam' },
          { value: 'cctv', label: 'CCTV terpasang & berfungsi di titik-titik utama' },
          { value: 'pagar', label: 'Pagar/tembok keliling mengamankan area' },
          { value: 'akses', label: 'Kontrol akses keluar-masuk (kartu/log tamu) diterapkan' },
        ],
      },
    ],
  },
];

// ============================================================
// OPSI BERSAMA
// ============================================================

const SISTEM_PENYIMPANAN_OPTIONS = [
  { value: 'biasa', label: 'Penyimpanan Biasa — tumpukan padat s.d. 5 m, atau rak s.d. 4 m' },
  { value: 'tinggi', label: 'Penyimpanan Tinggi — tumpukan padat >5 m, atau rak >4–8 m' },
  { value: 'rak_sangat_tinggi', label: 'Penyimpanan Rak Sangat Tinggi (Very High Rack Storage) — rak >8 m' },
  { value: 'asrs', label: 'Penyimpanan ASRS (Automated Storage and Retrieval System)' },
  { value: 'solid_bulk', label: 'Penyimpanan Padatan Curah (Solid Bulk)' },
  { value: 'liquid_storage', label: 'Penyimpanan Cairan (Liquid Storage) — drum, IBC, jerigen, atau container sejenis' },
  { value: 'tank_storage', label: 'Penyimpanan Cairan dalam Tangki (Tank Storage) — fixed tank' },
  { value: 'lainnya', label: 'Lainnya' },
];

const YA_TIDAK = [
  { value: 'ya', label: 'Ya' },
  { value: 'tidak', label: 'Tidak' },
];

const YA_TIDAK_TAHU = [
  { value: 'ya', label: 'Ya' },
  { value: 'tidak', label: 'Tidak' },
  { value: 'tidak_tahu', label: 'Tidak Tahu' },
];

const SISTEM_HINT =
  'Catatan: Informasi detail terkait jenis kemasan, kapasitas penyimpanan (volume) per unit, jumlah unit tangki serta keterangan lainnya agar ditambahkan dalam kolom detail sistem penyimpanan.';

// ============================================================
// KHUSUS OKUPANSI (Section 2 prototipe — Pabrik / Gudang / Commercial / Others)
// ============================================================

const TEMBAKAU_COND: ShowCond[] = [{ key: 'gd_komoditas', value: 'tembakau' }];
const PRIBADI_COND: ShowCond[] = [{ key: 'gd_klasifikasi', value: 'pribadi' }];
const KANTOR_COND: ShowCond[] = [{ key: 'cm_tipe', value: 'kantor' }];
const FNB_COND: ShowCond[] = [{ key: 'cm_tipe', value: ['retail', 'hotel'] }];
const HOTEL_COND: ShowCond[] = [{ key: 'cm_tipe', value: 'hotel' }];
const LAUNDRY_COND: ShowCond[] = [{ key: 'cm_tipe', value: 'hotel' }, { key: 'ht_laundry', value: ['ya', 'tidak_tahu'] }];
const BOILER_COND: ShowCond[] = [...LAUNDRY_COND, { key: 'ht_boiler', value: ['ya', 'tidak_tahu'] }];
const KESEHATAN_COND: ShowCond[] = [{ key: 'cm_tipe', value: 'kesehatan' }];
const APARTEMEN_COND: ShowCond[] = [{ key: 'cm_tipe', value: 'apartemen' }];
const DATACENTER_COND: ShowCond[] = [{ key: 'cm_tipe', value: 'datacenter' }];

export const OCC_SP_JENIS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'pabrik', label: '🏭 Pabrik' },
  { value: 'gudang', label: '🏬 Gudang' },
  { value: 'commercial', label: '🏢 Commercial — Perkantoran / Restoran-Mall / Hotel / RS / Apartemen / Data Center' },
  { value: 'others', label: '📦 Others' },
];

const DC_ASSESS_OPTIONS = [
  { value: 'structural', label: 'Uji Kelayakan dan Keandalan Struktur (Struktural)' },
  { value: 'mep', label: 'Uji Kelayakan Mekanikal, Elektrikal, & Plambing (MEP Assessment)' },
  { value: 'slf', label: 'Sudah mendapatkan Sertifikat Laik Fungsi (SLF) Khusus Pusat Data' },
];

const DC_PROTEKSI_OPTIONS = [
  { value: 'clean', label: 'Clean Agent Fire Suppression System' },
  { value: 'vesda', label: 'Aspirating Smoke Detector (ASD) / Very Early Smoke Detection Apparatus (VESDA)' },
  { value: 'preaction', label: 'Pre-action sprinkler' },
  { value: 'ext', label: 'Clean Agent Portable Fire Extinguisher' },
  { value: 'hydrogen', label: 'Hydrogen leak detector' },
  { value: 'other', label: 'Lainnya' },
];

const DC_REDUNDANCY_OPTIONS = [
  { value: 'n+1', label: 'N+1' },
  { value: 'n+2', label: 'N+2' },
  { value: '2n', label: '2N' },
  { value: '2n+1', label: '2N+1' },
  { value: 'lainnya', label: 'Lainnya' },
];

const DC_BATTERY_OPTIONS = [
  { value: 'vrla', label: 'VRLA' },
  { value: 'lithium', label: 'Lithium' },
  { value: 'lainnya', label: 'Lainnya' },
];

const INTERNAL_EXTERNAL = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
];

const GUDANG_OJK_CODES = [
  { value: '29371', label: '29371 — Non Hazardous Goods (Steel, Concrete, Food & Beverage dan bahan non-combustible lainnya)' },
  { value: '29372', label: '29372 — Plastic' },
  { value: '29373', label: '29373 — Electronic Equipment and Peripherals' },
  { value: '29374', label: '29374 — Textile Goods, Yarn' },
  { value: '29375', label: '29375 — Chemical (Fertilizer, Flammable Chemical: LPG, LNG, Petrol, Oil, Kerosene, dll)' },
  { value: '29376', label: '29376 — Paper, Rubber, Leather & Wood dan Finished Goods-nya' },
  { value: '29377', label: '29377 — Others Hazardous Goods' },
  { value: '29378', label: '29378 — Public Warehouses 🚩 (tidak memenuhi syarat Gudang Pribadi)' },
];

export const OCC_BLOCKS: Record<string, { label: string; tip?: string; fields: FieldDef[] }> = {
  // ===================== PABRIK =====================
  pabrik: {
    label: '🏭 Pabrik',
    fields: [
      { key: 'pb_material', label: 'Material (Bahan Baku Utama)', type: 'text', required: true, placeholder: 'Contoh: biji plastik, kain, besi, kayu', cols: 2 },
      { key: 'pb_proses', label: 'Proses Produksi', type: 'textarea', required: true, placeholder: 'Jelaskan alur proses produksi secara singkat...' },
      { key: 'pb_produk', label: 'Produk (Hasil Akhir)', type: 'text', required: true, placeholder: 'Contoh: kemasan plastik, garmen', cols: 2 },
      { key: 'pb_mesin', label: 'Mesin Utama', type: 'text', required: true, placeholder: 'Contoh: mesin injeksi, mesin tenun, boiler', cols: 2 },
      {
        key: '_pb_tip',
        type: 'notice',
        tone: 'info',
        label: '📦 Pabrik juga dinilai dari area gudangnya. Isi kondisi penyimpanan Bahan Baku dan Produk secara terpisah. Tidak diperlukan klasifikasi Gudang Pribadi/Gudang Umum pada bagian pabrik.',
      },
      { key: '_pb_h_bb', type: 'heading', label: 'Gudang Bahan Baku' },
      { key: 'pb_bb_barang', label: 'Kategori Barang yang Disimpan — Bahan Baku', type: 'text', placeholder: 'Contoh: resin, kain, tepung, bahan kimia, komponen' },
      { key: 'pb_bb_sistem', label: 'Sistem Penyimpanan — Bahan Baku', type: 'select', options: SISTEM_PENYIMPANAN_OPTIONS, hint: SISTEM_HINT, cols: 2 },
      { key: 'pb_bb_detail', label: 'Detail Sistem Penyimpanan / Keterangan Tambahan — Bahan Baku', type: 'textarea', placeholder: 'Jenis kemasan, kapasitas per unit, jumlah unit/tangki, tinggi/jarak tumpukan, dan keterangan lain...' },
      { key: '_pb_h_pr', type: 'heading', label: 'Gudang Produk' },
      { key: 'pb_produk_barang', label: 'Kategori Barang yang Disimpan — Produk', type: 'text', placeholder: 'Contoh: finished goods, karton, elektronik, produk jadi' },
      { key: 'pb_produk_sistem', label: 'Sistem Penyimpanan — Produk', type: 'select', options: SISTEM_PENYIMPANAN_OPTIONS, hint: SISTEM_HINT, cols: 2 },
      { key: 'pb_produk_detail', label: 'Detail Sistem Penyimpanan / Keterangan Tambahan — Produk', type: 'textarea', placeholder: 'Jenis kemasan, kapasitas per unit, jumlah unit/tangki, tinggi/jarak tumpukan, dan keterangan lain...' },
    ],
  },

  // ===================== GUDANG =====================
  gudang: {
    label: '🏬 Gudang',
    fields: [
      { key: '_gd_h', type: 'heading', label: 'Pertanyaan Khusus Gudang 🟢 Divalidasi Pak Nuklin' },
      { key: 'gd_barang', label: 'Kategori Barang yang Disimpan', type: 'text', placeholder: 'Contoh: bahan makanan kemasan, tekstil, elektronik, bahan kimia' },
      {
        key: 'gd_komoditas',
        label: 'Klasifikasi Komoditas Gudang',
        type: 'select',
        required: true,
        options: [
          { value: 'tembakau', label: 'Gudang Tembakau' },
          { value: 'non_tembakau', label: 'Gudang Non-Tembakau' },
        ],
        hint: 'Klasifikasi ini berdiri terpisah dari klasifikasi kepemilikan/pengelolaan gudang. Jika memilih Gudang Tembakau, checklist khusus tembakau akan terbuka otomatis.',
      },

      // ---- Checklist Gudang Tembakau (muncul otomatis) ----
      { key: '_tb_tip', type: 'notice', tone: 'info', showWhen: TEMBAKAU_COND, label: '🌿 Checklist Survey Gudang Tembakau — ditampilkan otomatis karena klasifikasi komoditas gudang dipilih Tembakau. Pertanyaan mengikuti file Checklist_Survey_Gudang_Tembakau.xlsx.' },
      { key: 'tb_asal', label: '1.1 — Dari mana asal tembakau yang disimpan (langsung dari petani / sudah diproses)?', type: 'select', showWhen: TEMBAKAU_COND, options: [{ value: 'petani', label: 'Langsung dari petani' }, { value: 'proses', label: 'Sudah diproses' }, { value: 'campuran', label: 'Campuran / lainnya' }], cols: 2 },
      { key: 'tb_jenis', label: '1.2 — Jenis tembakau apa saja yang disimpan?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Sebutkan jenis tembakau', cols: 2 },
      { key: 'tb_kemasan', label: '1.3 — Bagaimana bentuk & jenis kemasannya (karung, bal, kotak, dll)?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Karung, bal, kotak, dll.' },
      { key: 'tb_staff', label: '2.1 — Apakah ada karyawan yang standby/kerja terus menerus di dalam gudang?', type: 'select', showWhen: TEMBAKAU_COND, options: YA_TIDAK, cols: 2 },
      { key: 'tb_pengawasan', label: '2.2 — Bagaimana sistem pengawasan gudang dilakukan (patroli, CCTV, sensor, dll)?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Patroli, CCTV, sensor, dll.', cols: 2 },
      { key: 'tb_turnover', label: '3.1 — Bagaimana perputaran stok (turnover) di gudang?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Jelaskan pola/periode turnover', cols: 2 },
      { key: 'tb_lama', label: '3.2 — Berapa lama rata-rata tembakau disimpan (mingguan, bulanan, tahunan)?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Mingguan, bulanan, tahunan', cols: 2 },
      { key: 'tb_tahunan', label: '3.3 — Apakah ada stok yang disimpan hingga tahunan?', type: 'select', showWhen: TEMBAKAU_COND, options: YA_TIDAK, cols: 2 },
      { key: 'tb_sop_rotasi', label: '4.1 — Apakah ada SOP untuk rotasi tumpukan stok (misalnya sistem over staple)?', type: 'select', showWhen: TEMBAKAU_COND, options: YA_TIDAK, cols: 2 },
      { key: 'tb_frek_rotasi', label: '4.2 — Jika ada, seberapa sering rotasi dilakukan?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Contoh: setiap 2 minggu / bulanan' },
      { key: 'tb_tinggi', label: '5.1 — Berapa estimasi ketinggian maksimum tumpukan stok tembakau?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Contoh: 4 meter', cols: 2 },
      { key: 'tb_batas_tinggi', label: '5.2 — Apakah ada aturan yang membatasi tinggi tumpukan?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Jelaskan batas/ketentuan', cols: 2 },
      { key: 'tb_jarak', label: '5.3 — Seberapa rapat antar tumpukan disusun?', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Jelaskan jarak antar tumpukan' },
      { key: 'tb_suhu_stok', label: '6.1 — Apakah dilakukan pengukuran suhu pada stok tembakau? (Metode & frekuensi)', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Metode & frekuensi', cols: 2 },
      { key: 'tb_suhu_ruang', label: '6.2 — Apakah dilakukan pemantauan suhu ruangan gudang secara rutin? (Hasil rata-rata)', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Frekuensi & hasil rata-rata', cols: 2 },
      { key: 'tb_kelembapan', label: '6.3 — Apakah dilakukan pemantauan kelembapan udara gudang? (Metode & hasil)', type: 'text', showWhen: TEMBAKAU_COND, placeholder: 'Metode & hasil' },
      { key: 'tb_ventilasi', label: '7.1 — Bagaimana sistem ventilasi gudang? (Alami: jendela/lubang angin. Mekanis: kipas, exhaust, blower, AC, dehumidifier)', type: 'textarea', showWhen: TEMBAKAU_COND, placeholder: 'Alami: jendela/lubang angin. Mekanis: kipas, exhaust, blower, AC, dehumidifier' },
      { key: 'tb_kondisi', label: '7.2 — Bagaimana kondisi di dalam gudang saat dirasakan langsung (panas, sumpek, lembap, dll)?', type: 'textarea', showWhen: TEMBAKAU_COND, placeholder: 'Panas, sumpek, lembap, dll.' },
      { key: '_tb_foto', type: 'notice', tone: 'info', showWhen: TEMBAKAU_COND, label: '📷 Foto (8.1 kemasan, 8.2 ketinggian tumpukan, 8.3 jarak antar tumpukan, 8.4 ventilasi) diunggah pada langkah Upload Dokumen.' },

      // ---- Kepemilikan / Pengelolaan ----
      {
        key: 'gd_klasifikasi',
        label: 'Klasifikasi Kepemilikan / Pengelolaan Gudang',
        type: 'select',
        required: true,
        options: [
          { value: 'pribadi', label: 'Gudang Pribadi' },
          { value: 'umum', label: 'Gudang Umum' },
        ],
      },
      { key: '_gd_pri_tip', type: 'notice', tone: 'info', showWhen: PRIBADI_COND, label: 'Untuk bisa memenuhi kriteria sebagai Gudang Pribadi, seluruh syarat berikut harus dicentang.' },
      {
        key: 'gd_pribadi_syarat',
        label: 'Syarat Gudang Pribadi',
        type: 'check',
        showWhen: PRIBADI_COND,
        options: [
          { value: 's1', label: 'Gudang disewa oleh tertanggung secara langsung dari pemilik gudang atau pemilik bangunan/tempat penimbunan' },
          { value: 's2', label: 'Gudang yang dimiliki oleh tertanggung, atau disewa oleh tertanggung sebagaimana syarat no. 1, secara khusus dipergunakan untuk menimbun barang-barang yang seluruhnya menjadi milik/kepentingan tertanggung yang bersangkutan, dan sama sekali tidak terdapat barang-barang milik/kepentingan pihak lain — kecuali barang yang telah menjadi milik/kepentingan pembelinya yang (karena sesuatu hal yang dibenarkan/lazim terjadi dalam transaksi jual beli) belum diambil oleh pembeli yang bersangkutan dan masih berada dalam gudang tersebut' },
          { value: 's3', label: 'Pengelolaan isi gudang tersebut pada syarat no. 2 di atas dilaksanakan oleh dan menjadi tanggung jawab sepenuhnya dari tertanggung. Pengelolaan Gudang: dilakukan oleh pemilik gudang atau pemilik barang' },
        ],
      },
      { key: 'gd_ojk_code', label: 'Kategori Barang (Kode OJK)', type: 'select', required: true, showWhen: PRIBADI_COND, options: GUDANG_OJK_CODES },

      // ---- Sistem Penyimpanan ----
      { key: 'gd_sistem', label: 'Sistem Penyimpanan', type: 'select', options: SISTEM_PENYIMPANAN_OPTIONS, hint: SISTEM_HINT, cols: 2 },
      { key: '_gd_redflag_sistem', type: 'notice', tone: 'danger', showWhen: [{ key: 'gd_sistem', value: ['rak_sangat_tinggi', 'asrs'] }], label: '🚩 Red Flag — sistem penyimpanan ini berisiko tinggi, wajib eskalasi ke Risk Engineering.' },
      { key: 'gd_sistem_detail', label: 'Detail Sistem Penyimpanan / Keterangan Tambahan', type: 'textarea', placeholder: 'Jenis kemasan, kapasitas per unit, jumlah unit/tangki, tinggi/jarak tumpukan, dan keterangan lainnya...' },

      // ---- Cold Storage ----
      { key: 'gd_cold', label: 'Ada Area Cold Storage?', type: 'yesno', cols: 2 },
      {
        key: 'gd_cold_pct',
        label: 'Berapa % Cold Storage dari Total Luas Bangunan?',
        type: 'select',
        showWhen: [{ key: 'gd_cold', value: 'yes' }],
        options: [
          { value: 'lte10', label: '≤ 10%' },
          { value: 'lainnya', label: 'Lainnya' },
        ],
        cols: 2,
      },
      { key: 'gd_cold_pct_manual', label: 'Persentase Cold Storage', type: 'number', showWhen: [{ key: 'gd_cold', value: 'yes' }, { key: 'gd_cold_pct', value: 'lainnya' }], placeholder: 'Isi manual persentase, contoh: 25', cols: 2 },

      // ---- Forklift ----
      { key: 'gd_forklift', label: 'Ada Aktivitas Charging Forklift Baterai?', type: 'yesno', cols: 2 },
      {
        key: 'gd_fork_jarak',
        label: 'Apakah Stasiun Charging Memiliki Jarak Memadai (minimal 1,5 m) dari Barang Mudah Terbakar?',
        type: 'yesno',
        showWhen: [{ key: 'gd_forklift', value: 'yes' }],
      },
      { key: '_gd_redflag_fork', type: 'notice', tone: 'danger', showWhen: [{ key: 'gd_forklift', value: 'yes' }, { key: 'gd_fork_jarak', value: 'no' }], label: '🚩 Red Flag — jarak stasiun charging forklift kurang dari 1,5 m dari barang mudah terbakar (tidak sesuai ketentuan).' },

      // ---- Lampu Merkuri / HID ----
      { key: 'gd_hid', label: 'Ada Instalasi Lampu Merkuri / HID?', type: 'yesno', cols: 2 },
      { key: 'gd_hid_cover', label: 'Apakah Lampu Tercover / Ter-shield?', type: 'yesno', showWhen: [{ key: 'gd_hid', value: 'yes' }] },
      { key: '_gd_redflag_hid', type: 'notice', tone: 'danger', showWhen: [{ key: 'gd_hid', value: 'yes' }, { key: 'gd_hid_cover', value: 'no' }], label: '🚩 Red Flag — lampu merkuri/HID tidak tercover (tidak sesuai ketentuan).' },
    ],
  },

  // ===================== COMMERCIAL =====================
  commercial: {
    label: '🏢 Commercial',
    fields: [
      { key: 'cm_mb', label: 'Ada Coverage MB?', type: 'yesno', cols: 2 },
      { key: '_cm_mb_note', type: 'notice', tone: 'warn', showWhen: [{ key: 'cm_mb', value: 'yes' }], label: 'Jika ada Coverage MB, konsultasi dengan Risk Engineer HO.' },
      {
        key: 'cm_tipe',
        label: 'Sub-Tipe Commercial',
        type: 'select',
        required: true,
        options: [
          { value: 'kantor', label: 'Perkantoran' },
          { value: 'retail', label: 'Restoran / Mall dengan tenant F&B' },
          { value: 'hotel', label: 'Hotel' },
          { value: 'kesehatan', label: 'Rumah Sakit' },
          { value: 'apartemen', label: 'Apartemen' },
          { value: 'datacenter', label: 'Data Center' },
        ],
      },

      // ---- KANTOR ----
      { key: 'kt_kapasitas', label: 'Jumlah Lantai & Estimasi Kapasitas Orang', type: 'text', showWhen: KANTOR_COND, placeholder: 'Contoh: 10 lantai, ±500 orang', cols: 2 },
      { key: 'kt_server', label: 'Ada Ruang Server / Data Center?', type: 'yesno', showWhen: KANTOR_COND, cols: 2 },
      { key: 'kt_fm200', label: 'Jika ada ruang server, proteksi kebakaran khusus (gas/FM200) tersedia?', type: 'yesno', showWhen: KANTOR_COND },
      { key: 'kt_lift', label: 'Jumlah Lift & Tangga Darurat', type: 'text', showWhen: KANTOR_COND, placeholder: 'Contoh: 4 lift, 2 tangga darurat', cols: 2 },
      { key: 'kt_parkir', label: 'Lokasi Area Parkir', type: 'select', showWhen: KANTOR_COND, options: [{ value: 'basement', label: 'Basement gedung' }, { value: 'terpisah', label: 'Gedung terpisah' }, { value: 'luar', label: 'Area terbuka' }], cols: 2 },

      // ---- F&B (Restoran / Mall F&B / Hotel) ----
      { key: '_fnb_tip', type: 'notice', tone: 'info', showWhen: FNB_COND, label: '🍳 Berlaku untuk Restoran, Mall dengan tenant F&B, dan Hotel.' },
      { key: 'fb_gas', label: 'Jenis bahan bakar/gas untuk aktivitas memasak', type: 'select', showWhen: FNB_COND, options: [{ value: 'lpg', label: 'LPG' }, { value: 'cng', label: 'CNG' }, { value: 'lng', label: 'LNG' }, { value: 'lainnya', label: 'Lainnya' }, { value: 'none', label: 'Tidak menggunakan gas' }], cols: 2 },
      { key: 'fb_sistem_gas', label: 'Sistem gas dapur', type: 'select', showWhen: FNB_COND, options: [{ value: 'sentral', label: 'Gas sentral' }, { value: 'tabung', label: 'Tabung gas individual' }, { value: 'none', label: 'Tidak ada / N/A' }], cols: 2 },
      { key: 'fb_kapasitas_gas', label: 'Kapasitas total penyimpanan gas/LPG terbesar di lokasi', type: 'text', showWhen: FNB_COND, placeholder: 'Contoh: 12 x 50 kg / 2.000 kg', cols: 2 },
      { key: 'fb_lokasi_gas', label: 'Lokasi penyimpanan tabung gas/LPG', type: 'text', showWhen: FNB_COND, placeholder: 'Jelaskan lokasi penyimpanan', cols: 2 },
      { key: 'fb_detector', label: 'Tersedia gas detector di area dapur dan/atau penyimpanan gas?', type: 'select', showWhen: FNB_COND, options: YA_TIDAK_TAHU, cols: 2 },
      { key: 'fb_solenoid', label: 'Tersedia katup otomatis (solenoid valve) untuk menghentikan aliran gas?', type: 'select', showWhen: FNB_COND, options: YA_TIDAK_TAHU, cols: 2 },
      { key: 'fb_deep_fry', label: 'Ada kegiatan deep frying menggunakan minyak dalam jumlah besar? Jika ya, berapa kapasitas terbesar?', type: 'text', showWhen: FNB_COND, placeholder: 'Tidak / Ya, kapasitas ... liter' },
      { key: 'fb_hood_supp', label: 'Kitchen hood dilengkapi automatic fire suppression system?', type: 'select', showWhen: FNB_COND, options: YA_TIDAK_TAHU, cols: 2 },
      { key: 'fb_hood_clean', label: 'Kitchen hood, filter & ducting dibersihkan/dirawat rutin? Kapan terakhir?', type: 'text', showWhen: FNB_COND, placeholder: 'Frekuensi & tanggal terakhir', cols: 2 },
      { key: 'fb_close_check', label: 'Ada prosedur pemeriksaan dapur sebelum operasional ditutup setiap hari?', type: 'select', showWhen: FNB_COND, options: YA_TIDAK_TAHU, cols: 2 },
      { key: 'fb_inspeksi', label: 'Pengelola gedung melakukan inspeksi keselamatan tenant F&B berkala?', type: 'select', showWhen: FNB_COND, options: YA_TIDAK_TAHU, cols: 2 },
      { key: 'fb_ext', label: 'Tersedia fire extinguisher yang sesuai untuk area cooking/deep frying?', type: 'select', showWhen: FNB_COND, options: YA_TIDAK_TAHU, cols: 2 },
      { key: 'fb_spr_hyd', label: 'Sprinkler dan/atau hydrant tersedia dan mencakup area dapur/tenant?', type: 'select', showWhen: FNB_COND, options: YA_TIDAK_TAHU, cols: 2 },

      // ---- HOTEL (laundry & utilitas) ----
      { key: '_ht_h', type: 'heading', showWhen: HOTEL_COND, label: 'Pertanyaan Tambahan Hotel' },
      { key: '_ht_h1', type: 'heading', showWhen: HOTEL_COND, label: 'Bagian 1: Keberadaan & Lokasi Area Laundry' },
      { key: 'ht_laundry', label: '1. Terdapat laundry di dalam area hotel?', type: 'select', showWhen: HOTEL_COND, options: YA_TIDAK_TAHU, hint: 'Jika jawabannya Tidak, pertanyaan lanjutan terkait laundry dapat di-skip.' },
      { key: 'ht_laundry_floor', label: '2. Ruang laundry berada di lantai mana?', type: 'text', showWhen: LAUNDRY_COND, placeholder: 'Contoh: Basement 1 / Lantai 2' },
      { key: '_ht_h2', type: 'heading', showWhen: LAUNDRY_COND, label: 'Bagian 2: Kondisi Lingkungan & Tata Graha (Housekeeping)' },
      { key: 'ht_housekeeping', label: '3. Kondisi housekeeping ruangan laundry', type: 'select', showWhen: LAUNDRY_COND, options: [{ value: 'bersih', label: 'Bersih' }, { value: 'sedikit', label: 'Ada sedikit akumulasi serat kain' }, { value: 'berlebihan', label: 'Akumulasi serat kain berlebihan' }] },
      { key: '_ht_h3', type: 'heading', showWhen: LAUNDRY_COND, label: 'Bagian 3: Risiko Operasional Mesin Pengering (Tumble Dryer)' },
      { key: 'ht_lint_filter', label: '4. Apakah filter serat (lint filter) pada setiap mesin pengering dibersihkan setiap pergantian shift atau setiap hari?', type: 'select', showWhen: LAUNDRY_COND, options: YA_TIDAK_TAHU },
      { key: 'ht_exhaust', label: '5. Apakah saluran pembuangan udara panas (exhaust duct) mesin pengering dibersihkan secara berkala?', type: 'select', showWhen: LAUNDRY_COND, options: [{ value: 'ya', label: 'Ya (minimal 6 bulan sekali)' }, { value: 'tidak', label: 'Tidak' }, { value: 'tidak_tahu', label: 'Tidak Tahu' }] },
      { key: 'ht_cooldown', label: '6. Apakah ada prosedur untuk mendinginkan (cool-down cycle) kain/linen di dalam mesin pengering sebelum ditumpuk atau dilipat?', type: 'select', showWhen: LAUNDRY_COND, options: YA_TIDAK_TAHU },
      { key: '_ht_h4', type: 'heading', showWhen: LAUNDRY_COND, label: 'Bagian 4: Risiko Utilitas Tinggi & Bahan Bakar (Boiler)' },
      { key: 'ht_boiler', label: '7. Terdapat mesin boiler untuk keperluan laundry di dalam hotel?', type: 'select', showWhen: LAUNDRY_COND, options: YA_TIDAK_TAHU, hint: 'Jika jawabannya Tidak, pertanyaan nomor 8 dan 9 dapat di-skip.' },
      { key: 'ht_boiler_detail', label: '8. Jelaskan jumlah unit boiler, kapasitas, merk boiler, tahun pembuatan', type: 'textarea', showWhen: BOILER_COND, placeholder: 'Jumlah unit, kapasitas, merk, tahun pembuatan...' },
      { key: 'ht_boiler_fuel', label: '9. Jika terdapat mesin boiler, apa jenis bahan bakar yang digunakan?', type: 'select', showWhen: BOILER_COND, options: [{ value: 'lpg', label: 'LPG' }, { value: 'pgn', label: 'Gas alam (pipa PGN)' }, { value: 'cng', label: 'CNG' }, { value: 'solar', label: 'Solar' }, { value: 'lainnya', label: 'Bahan bakar lainnya' }] },
      { key: 'ht_boiler_fuel_other', label: 'Jelaskan bahan bakar lainnya', type: 'text', showWhen: [...BOILER_COND, { key: 'ht_boiler_fuel', value: 'lainnya' }] },
      { key: 'ht_gas_detector', label: '10. Terdapat gas detector di area boiler dan laundry?', type: 'select', showWhen: LAUNDRY_COND, options: YA_TIDAK_TAHU },
      { key: '_ht_h5', type: 'heading', showWhen: LAUNDRY_COND, label: 'Bagian 5: Jalur Evakuasi Khusus (Linen Chute)' },
      { key: 'ht_chute', label: '11. Apakah tersedia Laundry/Linen Chute?', type: 'select', showWhen: LAUNDRY_COND, options: YA_TIDAK_TAHU, hint: 'Laundry chute adalah saluran vertikal/jalur khusus pada bangunan bertingkat untuk menjatuhkan pakaian kotor dan linen dari lantai atas ke ruang cuci utama atau ruang bawah tanah.' },
      { key: 'ht_chute_fire', label: '12. Jika tersedia, bagaimana mitigasi dan proteksi kebakaran di area laundry chute?', type: 'textarea', showWhen: [...LAUNDRY_COND, { key: 'ht_chute', value: ['ya', 'tidak_tahu'] }] },
      { key: '_ht_h6', type: 'heading', showWhen: LAUNDRY_COND, label: 'Bagian 6: Proteksi Kebakaran Keseluruhan Area' },
      { key: 'ht_laundry_fire', label: '13. Jelaskan fasilitas proteksi kebakaran di ruang laundry (misal: APAR, Sprinkler, Fire Detector)', type: 'textarea', showWhen: LAUNDRY_COND },

      // ---- RUMAH SAKIT ----
      { key: 'rs_highvalue', label: 'Peralatan medis bernilai tinggi (MRI, CT Scan, PET Scan, LINAC, dll.) — jenis & perkiraan nilai', type: 'textarea', showWhen: KESEHATAN_COND, placeholder: 'Sebutkan jenis peralatan dan perkiraan nilainya' },
      { key: 'rs_lokasi', label: 'Lokasi peralatan medis bernilai tinggi', type: 'text', showWhen: KESEHATAN_COND, placeholder: 'Basement, lantai dasar, lantai atas, dll.' },
      { key: 'rs_fireprot', label: 'Proteksi kebakaran pada ruangan peralatan bernilai tinggi', type: 'textarea', showWhen: KESEHATAN_COND, placeholder: 'Sprinkler, smoke detector, fire suppression system, dll.' },
      { key: 'rs_medgas', label: 'Medical gas / bahan mudah terbakar (oxygen, LPG, diesel oil) — jenis, kapasitas & lokasi', type: 'textarea', showWhen: KESEHATAN_COND, placeholder: 'Jelaskan jenis, kapasitas dan lokasi' },
      { key: 'rs_water', label: 'Potensi water damage di sekitar peralatan bernilai tinggi & ketersediaan water leak detection', type: 'textarea', showWhen: KESEHATAN_COND, placeholder: 'Pipa air, toilet, pantry, water tank/ruang basah di atas/berdekatan; ada/tidak water leak detection' },
      { key: 'rs_security', label: 'Kontrol akses, CCTV/security untuk mencegah unauthorized access / theft', type: 'textarea', showWhen: KESEHATAN_COND, placeholder: 'Jelaskan pembatasan akses dan pengawasan' },

      // ---- DATA CENTER ----
      { key: '_dc_h1', type: 'heading', showWhen: DATACENTER_COND, label: 'I. UMUM' },
      { key: 'dc_purpose', label: '1. Apakah bangunan ini merupakan bangunan yang sejak awal didesain dan dibangun untuk digunakan sebagai Data Center?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU },
      { key: 'dc_assess', label: '2. Jika tidak, apakah sebelum dialihfungsikan menjadi Data Center pernah dilakukan:', type: 'check', showWhen: [...DATACENTER_COND, { key: 'dc_purpose', value: 'tidak' }], options: DC_ASSESS_OPTIONS },
      { key: '_dc_warn', type: 'notice', tone: 'danger', showWhen: [...DATACENTER_COND, { key: 'dc_purpose', value: 'tidak' }, { key: 'dc_assess', value: ['structural', 'mep', 'slf'], op: 'notAll' }], label: '⚠️ Peringatan: bangunan belum memenuhi persyaratan digunakan sebagai Data Center karena masih ada persyaratan yang belum terpenuhi.' },
      { key: 'dc_uptime', label: '3. Apakah Data Center ini sudah mendapatkan Sertifikasi Tier Uptime Institute?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU, cols: 2 },
      { key: 'dc_tier', label: '4. Jika ya, jenis sertifikasinya', type: 'select', showWhen: [...DATACENTER_COND, { key: 'dc_uptime', value: 'ya' }], options: [{ value: 'tier1', label: 'Tier I' }, { value: 'tier2', label: 'Tier II' }, { value: 'tier3', label: 'Tier III' }, { value: 'tier4', label: 'Tier IV' }], cols: 2 },
      { key: 'dc_other_cert', label: '5. Jika tidak, lembaga lain yang memberikan sertifikasi dan jenis sertifikasi?', type: 'textarea', showWhen: [...DATACENTER_COND, { key: 'dc_uptime', value: 'tidak' }], placeholder: 'Nama lembaga dan jenis sertifikasi' },
      { key: 'dc_datahall', label: '6.1. Data hall ada di lantai mana saja. Jelaskan nama data hall per lantai beserta luas areanya.', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Nama data hall, lantai, dan luas area' },
      { key: 'dc_datahall_62', label: '6.2. Apakah terdapat penggunaan...', type: 'textarea', showWhen: DATACENTER_COND },

      { key: '_dc_h2', type: 'heading', showWhen: DATACENTER_COND, label: 'II. UTILITAS PENDUKUNG' },
      { key: 'dc_it_load', label: '7. Berapa Kapasitas Beban IT', type: 'text', showWhen: DATACENTER_COND, placeholder: 'Kapasitas beban IT', cols: 2 },
      { key: 'dc_power_source', label: '8. Sumber daya listrik dari', type: 'select', showWhen: DATACENTER_COND, options: [{ value: 'pln', label: 'PLN' }, { value: 'lainnya', label: 'Lainnya' }], cols: 2 },
      { key: 'dc_feeder', label: '9. Sumber daya listrik berasal dari berapa penyulang', type: 'select', showWhen: DATACENTER_COND, options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '>3', label: 'Lebih dari 3' }], cols: 2 },
      { key: 'dc_elec_redundancy', label: '10. Apakah sistem kelistrikan memiliki sistem cadangan/redundansi?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU },
      { key: 'dc_elec_scheme', label: 'Jika ya, ketersediaan cadangan (redundansi) sistem kelistrikan', type: 'select', showWhen: [...DATACENTER_COND, { key: 'dc_elec_redundancy', value: 'ya' }], options: DC_REDUNDANCY_OPTIONS, cols: 2 },
      { key: 'dc_elec_other', label: 'Lainnya — jelaskan (redundansi kelistrikan)', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_elec_redundancy', value: 'ya' }, { key: 'dc_elec_scheme', value: 'lainnya' }], cols: 2 },
      { key: 'dc_tr_types', label: '11. Jenis transformer listrik', type: 'check', showWhen: DATACENTER_COND, options: [{ value: 'oil', label: 'Tipe Berpendingin Oli' }, { value: 'air', label: 'Tipe Berpendingin Udara' }, { value: 'other', label: 'Tipe lainnya' }] },
      { key: 'dc_tr_oil_detail', label: 'Transformer berpendingin oli — jumlah dan kapasitas', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_tr_types', value: ['oil'], op: 'all' }], placeholder: 'Jumlah dan kapasitas', cols: 2 },
      { key: 'dc_tr_air_detail', label: 'Transformer berpendingin udara — jumlah dan kapasitas', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_tr_types', value: ['air'], op: 'all' }], placeholder: 'Jumlah dan kapasitas', cols: 2 },
      { key: 'dc_tr_other_detail', label: 'Transformer tipe lainnya — jelaskan', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_tr_types', value: ['other'], op: 'all' }], placeholder: 'Jelaskan tipe, jumlah dan kapasitas', cols: 2 },
      { key: 'dc_cooling_redundancy', label: '12. Apakah sistem pendinginan memiliki sistem cadangan/redundansi?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU },
      { key: 'dc_cooling_scheme', label: 'Ketersediaan cadangan (redundansi) sistem pendinginan', type: 'select', showWhen: [...DATACENTER_COND, { key: 'dc_cooling_redundancy', value: 'ya' }], options: DC_REDUNDANCY_OPTIONS, cols: 2 },
      { key: 'dc_cooling_other', label: 'Lainnya — jelaskan (redundansi pendinginan)', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_cooling_redundancy', value: 'ya' }, { key: 'dc_cooling_scheme', value: 'lainnya' }], cols: 2 },
      { key: 'dc_cool_types', label: '13. Jenis pendinginan di dalam ruangan data hall', type: 'check', showWhen: DATACENTER_COND, options: [{ value: 'crac', label: 'CRAC (Computer Room Air Conditioning)' }, { value: 'fanwall', label: 'Fan Wall (Wall-of-Fans)' }, { value: 'crah', label: 'CRAH (Computer Room Air Handler)' }, { value: 'other', label: 'Lainnya' }] },
      { key: 'dc_crac_detail', label: 'CRAC — jumlah unit dan kapasitas per unit', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_cool_types', value: ['crac'], op: 'all' }], placeholder: 'Jumlah unit dan kapasitas per unit', cols: 2 },
      { key: 'dc_fanwall_detail', label: 'Fan Wall — jumlah unit dan kapasitas per unit', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_cool_types', value: ['fanwall'], op: 'all' }], placeholder: 'Jumlah unit dan kapasitas per unit', cols: 2 },
      { key: 'dc_crah_detail', label: 'CRAH — jumlah unit dan kapasitas per unit', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_cool_types', value: ['crah'], op: 'all' }], placeholder: 'Jumlah unit dan kapasitas per unit', cols: 2 },
      { key: 'dc_cooling_other_type_detail', label: 'Pendinginan lainnya — jelaskan', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_cool_types', value: ['other'], op: 'all' }], placeholder: 'Jelaskan jumlah unit dan kapasitas per unit', cols: 2 },
      { key: 'dc_util_genset', label: '14. Utilitas — Genset', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, spesifikasi/kapasitas' },
      { key: 'dc_util_cooling_tower', label: 'Utilitas — Cooling Tower', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, spesifikasi/kapasitas' },
      { key: 'dc_util_chiller', label: 'Utilitas — Chiller', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, spesifikasi/kapasitas' },
      { key: 'dc_util_ups', label: 'Utilitas — UPS', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, spesifikasi/kapasitas' },
      { key: 'dc_util_other', label: 'Utilitas — Lainnya', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, spesifikasi/kapasitas' },
      { key: 'dc_battery_it', label: '15. Jenis baterai yang digunakan untuk sistem IT', type: 'select', showWhen: DATACENTER_COND, options: DC_BATTERY_OPTIONS, cols: 2 },
      { key: 'dc_battery_it_other', label: 'Jelaskan jenis baterai IT lainnya', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_battery_it', value: 'lainnya' }], cols: 2 },
      { key: 'dc_battery_utility', label: '16. Jenis baterai yang digunakan untuk sistem Utility', type: 'select', showWhen: DATACENTER_COND, options: DC_BATTERY_OPTIONS, cols: 2 },
      { key: 'dc_battery_utility_other', label: 'Jelaskan jenis baterai utility lainnya', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_battery_utility', value: 'lainnya' }], cols: 2 },

      { key: '_dc_h3', type: 'heading', showWhen: DATACENTER_COND, label: 'III. PROTEKSI KEBAKARAN' },
      { key: 'dc_dh_proteksi', label: '17. Proteksi kebakaran di dalam ruangan data hall', type: 'check', showWhen: DATACENTER_COND, options: DC_PROTEKSI_OPTIONS.slice(0, 4).concat({ value: 'other', label: 'Lainnya' }) },
      { key: 'dc_dh_other_detail', label: 'Proteksi data hall lainnya — jelaskan', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_dh_proteksi', value: ['other'], op: 'all' }], placeholder: 'Jelaskan proteksi lainnya' },
      { key: 'dc_bat_proteksi', label: '18. Proteksi kebakaran di dalam ruangan battery', type: 'check', showWhen: DATACENTER_COND, options: DC_PROTEKSI_OPTIONS },
      { key: 'dc_bat_other_detail', label: 'Proteksi ruang battery lainnya — jelaskan', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_bat_proteksi', value: ['other'], op: 'all' }], placeholder: 'Jelaskan proteksi lainnya' },
      { key: 'dc_ups_proteksi', label: '19. Proteksi kebakaran di dalam ruangan UPS', type: 'check', showWhen: DATACENTER_COND, options: DC_PROTEKSI_OPTIONS.slice(0, 4).concat({ value: 'other', label: 'Lainnya' }) },
      { key: 'dc_ups_other_detail', label: 'Proteksi ruang UPS lainnya — jelaskan', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_ups_proteksi', value: ['other'], op: 'all' }], placeholder: 'Jelaskan proteksi lainnya' },
      { key: 'dc_genset_fire', label: '20. Proteksi kebakaran di dalam ruangan Genset', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Jelaskan' },
      { key: 'dc_fuel_storage_fire', label: 'Proteksi kebakaran di dalam ruangan penyimpanan bahan bakar utama', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Jelaskan' },

      { key: '_dc_h4', type: 'heading', showWhen: DATACENTER_COND, label: 'IV. BAHAN BAKAR' },
      { key: 'dc_fuel_type', label: '21. Jenis bahan bakar untuk Genset', type: 'text', showWhen: DATACENTER_COND },
      { key: 'dc_fuel_main', label: 'Penyimpanan utama', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, kapasitas' },
      { key: 'dc_fuel_daily', label: 'Penyimpanan harian', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, kapasitas' },
      { key: 'dc_fuel_other', label: 'Penyimpanan lainnya', type: 'textarea', showWhen: DATACENTER_COND, placeholder: 'Lokasi, jumlah unit, kapasitas' },

      { key: '_dc_h5', type: 'heading', showWhen: DATACENTER_COND, label: 'V. INSPEKSI, PERAWATAN DAN LAIN-LAIN' },
      { key: 'dc_panel_who', label: '22. Inspeksi dan Perawatan Keseluruhan / Rutin — Panel listrik dilakukan oleh:', type: 'check', showWhen: DATACENTER_COND, options: INTERNAL_EXTERNAL },
      { key: 'dc_panel_internal_detail', label: 'Panel listrik (internal) — ruang lingkup kerja, frekuensi', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_panel_who', value: ['internal'], op: 'all' }], placeholder: 'Ruang lingkup kerja, frekuensi', cols: 2 },
      { key: 'dc_panel_external_detail', label: 'Panel listrik (external) — nama perusahaan, ruang lingkup, frekuensi', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_panel_who', value: ['external'], op: 'all' }], placeholder: 'Nama perusahaan, ruang lingkup kerja, frekuensi', cols: 2 },
      { key: 'dc_genset_who', label: '23. Inspeksi dan perawatan pada Genset dilakukan oleh:', type: 'check', showWhen: DATACENTER_COND, options: INTERNAL_EXTERNAL },
      { key: 'dc_genset_internal_detail', label: 'Genset (internal) — ruang lingkup kerja, frekuensi', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_genset_who', value: ['internal'], op: 'all' }], placeholder: 'Ruang lingkup kerja, frekuensi', cols: 2 },
      { key: 'dc_genset_external_detail', label: 'Genset (external) — nama perusahaan, ruang lingkup, frekuensi', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_genset_who', value: ['external'], op: 'all' }], placeholder: 'Nama perusahaan, ruang lingkup kerja, frekuensi', cols: 2 },
      { key: 'dc_cool_who', label: '24. Inspeksi dan perawatan pada Sistem Pendinginan:', type: 'check', showWhen: DATACENTER_COND, options: INTERNAL_EXTERNAL },
      { key: 'dc_cool_internal_detail', label: 'Sistem pendinginan (internal) — ruang lingkup kerja, frekuensi', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_cool_who', value: ['internal'], op: 'all' }], placeholder: 'Ruang lingkup kerja, frekuensi', cols: 2 },
      { key: 'dc_cool_external_detail', label: 'Sistem pendinginan (external) — nama perusahaan, ruang lingkup, frekuensi', type: 'text', showWhen: [...DATACENTER_COND, { key: 'dc_cool_who', value: ['external'], op: 'all' }], placeholder: 'Nama perusahaan, ruang lingkup kerja, frekuensi', cols: 2 },
      { key: 'dc_thd', label: '25. Nilai / Evaluasi Sistem — Apakah nilai Total Harmonic Distortion (THD) sistem kelistrikan diukur dan dipantau secara berkala?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU },
      { key: 'dc_harmonic', label: '26. Pengukuran/keberadaan Harmonic — Apakah terdapat harmonic filter pada panel?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU },
      { key: 'dc_harmonic_where', label: '27. Jika ya, di panel mana saja harmonic filter dipasang?', type: 'textarea', showWhen: [...DATACENTER_COND, { key: 'dc_harmonic', value: 'ya' }] },
      { key: 'dc_surge', label: '28. Apakah terdapat surge arrestor pada panel?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU },
      { key: 'dc_surge_where', label: '29. Jika ya, di panel mana saja surge arrestor dipasang?', type: 'textarea', showWhen: [...DATACENTER_COND, { key: 'dc_surge', value: 'ya' }] },
      { key: 'dc_waterleak', label: '30. Apakah terdapat water leak detector?', type: 'select', showWhen: DATACENTER_COND, options: YA_TIDAK_TAHU },
      { key: 'dc_waterleak_where', label: '31. Jika ya, di mana saja water leak detector dipasang?', type: 'textarea', showWhen: [...DATACENTER_COND, { key: 'dc_waterleak', value: 'ya' }] },

      // ---- APARTEMEN ----
      { key: '_apart_tip', type: 'notice', tone: 'info', showWhen: APARTEMEN_COND, label: '🏢 Apartemen menggunakan penilaian umum Commercial/Residential dan data pada tab Occupancy, Construction, Protection, Exposure, dan Natural Hazards.' },
      { key: 'apart_note', label: 'Catatan khusus apartemen', type: 'textarea', showWhen: APARTEMEN_COND, placeholder: 'Jumlah tower/lantai, fasilitas bersama, area parkir, dan catatan risiko lain...' },
    ],
  },

  // ===================== OTHERS =====================
  others: {
    label: '📦 Others',
    fields: [
      { key: '_others_h', type: 'heading', label: 'Okupansi Lainnya (Others)' },
      { key: '_others_tip', type: 'notice', tone: 'warn', label: 'Untuk okupansi Others, konsultasi dengan Risk Engineer HO.' },
      { key: 'others_desc', label: 'Deskripsi Jenis Usaha & Hal Khusus yang Perlu Diperhatikan', type: 'textarea', placeholder: 'Jelaskan jenis usaha dan risiko spesifiknya...' },
    ],
  },
};

// ---------- field descriptor blok detail proteksi (revisi prototipe) ----------
// Dipakai SurveyorNewSurvey (input) dan surveyReport (laporan naratif PDF).

export const HIDRAN_DETAIL_FIELDS: FieldDef[] = [
  { key: 'p_hidran_indoor', label: 'Jumlah unit indoor hydrant', type: 'text', required: true, placeholder: 'Contoh: 4', cols: 2 },
  { key: 'p_hidran_outdoor', label: 'Jumlah unit outdoor hydrant', type: 'text', required: true, placeholder: 'Contoh: 2', cols: 2 },
  { key: '_jh', type: 'heading', label: 'Pompa joki' },
  { key: 'p_jockey_qty', label: 'Jumlah unit', type: 'text', required: true, placeholder: 'Contoh: 1', cols: 2 },
  { key: 'p_jockey_cap', label: 'Kapasitas (GPM / Liter per Menit / m³/jam)', type: 'text', required: true, placeholder: 'Contoh: 500 GPM', cols: 2 },
  { key: 'p_jockey_auto', label: 'Automatic start', type: 'select', required: true, options: YA_TIDAK_OPTIONS, cols: 2 },
  { key: '_mh', type: 'heading', label: 'Pompa utama elektrik' },
  { key: 'p_mainpump_qty', label: 'Jumlah unit', type: 'text', required: true, placeholder: 'Contoh: 2', cols: 2 },
  { key: 'p_mainpump_cap', label: 'Kapasitas (GPM / Liter per Menit / m³/jam)', type: 'text', required: true, placeholder: 'Contoh: 1.000 GPM', cols: 2 },
  { key: 'p_mainpump_auto', label: 'Automatic start', type: 'select', required: true, options: YA_TIDAK_OPTIONS, cols: 2 },
  { key: '_dh', type: 'heading', label: 'Pompa cadangan diesel' },
  { key: 'p_dieselpump_qty', label: 'Jumlah unit', type: 'text', required: true, placeholder: 'Contoh: 1', cols: 2 },
  { key: 'p_dieselpump_cap', label: 'Kapasitas (GPM / Liter per Menit / m³/jam)', type: 'text', required: true, placeholder: 'Contoh: 1.000 GPM', cols: 2 },
  { key: 'p_dieselpump_auto', label: 'Automatic start', type: 'select', required: true, options: YA_TIDAK_OPTIONS, cols: 2 },
  { key: 'p_hidran_water_cap', label: 'Kapasitas penyimpanan air untuk hydrant (m³ atau Liter)', type: 'text', required: true, placeholder: 'Contoh: 50 m³', cols: 2 },
];

export const DETEKTOR_DETAIL_FIELDS: FieldDef[] = [
  { key: 'p_det_normal', label: 'Apakah sistem detector kebakaran otomatis berfungsi secara normal?', type: 'select', required: true, options: YA_TIDAK_OPTIONS },
  { key: 'p_det_jenis', label: 'Jenis detektor kebakaran', type: 'check', required: true, options: DETECTOR_TYPE_OPTIONS },
  { key: 'p_det_coverage', label: 'Cakupan instalasi (dari total luas lantai)', type: 'select', required: true, options: P_COVERAGE_OPTIONS, cols: 2 },
  { key: 'p_det_area', label: 'Mohon dijelaskan area cakupan', type: 'textarea', required: true, placeholder: 'Contoh: seluruh lantai gudang 1–3, koridor, ruang listrik' },
];

export const SPRINKLER_DETAIL_FIELDS: FieldDef[] = [
  { key: 'p_spr_water_same', label: 'Suplai air sama dengan sistem hydrant?', type: 'select', required: true, options: YA_TIDAK_OPTIONS, cols: 2 },
  { key: 'p_spr_water_detail', label: 'Jika tidak, mohon dijelaskan', type: 'textarea', required: true, showWhen: [{ key: 'p_spr_water_same', value: 'tidak' }], placeholder: 'Jelaskan sumber & kapasitas suplai air sprinkler yang terpisah...' },
  { key: 'p_spr_coverage', label: 'Cakupan instalasi (dari total luas lantai)', type: 'select', required: true, options: P_COVERAGE_OPTIONS, cols: 2 },
  { key: 'p_spr_area', label: 'Mohon dijelaskan area cakupan', type: 'textarea', required: true, placeholder: 'Contoh: seluruh area produksi dan penyimpanan' },
];

/** Opsi arah mata angin untuk baris jarak fasilitas (Exposure). */
export const ARAH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'utara', label: 'Utara' },
  { value: 'timur_laut', label: 'Timur Laut' },
  { value: 'timur', label: 'Timur' },
  { value: 'tenggara', label: 'Tenggara' },
  { value: 'selatan', label: 'Selatan' },
  { value: 'barat_daya', label: 'Barat Daya' },
  { value: 'barat', label: 'Barat' },
  { value: 'barat_laut', label: 'Barat Laut' },
];

/** Konversi nilai mentah jadi label yang enak dibaca untuk ringkasan. */
export function fieldValueLabel(field: FieldDef, raw: string): string {
  const v = (raw ?? '').trim();
  if (v === '') return '';
  if (field.type === 'yesno') return v === 'yes' ? 'Ya' : v === 'no' ? 'Tidak' : v;
  if (field.type === 'check') {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => field.options?.find((o) => o.value === s)?.label ?? s)
      .join(', ');
  }
  if (field.type === 'select') return field.options?.find((o) => o.value === v)?.label ?? v;
  if (field.type === 'number') {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString('id-ID') : v;
  }
  return v;
}
