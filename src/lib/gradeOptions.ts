import type { ChoiceOption } from '../components/survey/ChoiceGroup';

/**
 * Opsi penilaian tiap seksi grading — teks & badge 1:1 dari prototipe
 * `src/public/Surver_Report__Revisi_Terbaru.html` (SURVEY_HTML_B64, revisi terbaru).
 */

// ============ MANAGEMENT ============

/** 5 aspek inti Management (Y/N per aspek — m1..m4 + m7, sesuai prototipe). */
export const M_CHECKLIST_ITEMS = [
  { id: 'm1', label: 'Kebersihan dan kerapihan — Lokasi terlihat bersih dan rapi secara visual' },
  { id: 'm2', label: 'Aturan merokok — Ada larangan merokok, tidak nampak puntung rokok di area berisiko' },
  { id: 'm3', label: 'Pelatihan kebakaran — Diadakan minimal 1x per tahun, ada bukti/dokumentasi' },
  { id: 'm4', label: 'Perawatan rutin — Ada program perawatan bangunan, listrik, dan mesin secara berkala' },
  { id: 'm7', label: 'Izin Kerja Panas (Hot Work Permit) — Ada prosedur & dokumen izin kerja panas' },
] as const;

export type MAspectId = (typeof M_CHECKLIST_ITEMS)[number]['id'];

export const M_ASPECT_OPTIONS: ChoiceOption[] = [
  { value: 'yes', label: 'Ya' },
  { value: 'no', label: 'Tidak' },
];

export const M_KLAIM_OPTIONS: ChoiceOption[] = [
  { value: '0', label: '0 klaim', badge: 'Tidak ada penalti', tone: 'good' },
  { value: '1-2', label: '1–2 klaim', badge: 'Perhatian', tone: 'avg' },
  { value: '3+', label: '≥ 3 klaim', badge: 'Penalti turun 1 tingkat', tone: 'marg' },
];

export const M_IMPROVEMENT_OPTIONS: ChoiceOption[] = [
  { value: 'yes', label: '✅ Sudah dilakukan', badge: 'Kredit naik 1 tingkat', tone: 'good' },
  { value: 'no', label: '❌ Belum dilakukan', badge: 'Tidak ada kredit', tone: 'avg' },
];

export const M_REKOMENDASI_OPTIONS: ChoiceOption[] = [
  { value: 'yes', label: '✅ Ya', badge: 'Kredit naik 1 tingkat', tone: 'good' },
  { value: 'no', label: '❌ Tidak / Belum ada rekomendasi', badge: 'Tidak ada kredit', tone: 'avg' },
];

/** Kategori pada baris detail kerugian/klaim (Loss History per kejadian). */
export const LOSS_KATEGORI_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'pabrik', label: 'Pabrik' },
  { value: 'gudang', label: 'Gudang' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'others', label: 'Others' },
];

/** Kategori okupansi besar — hanya untuk menampilkan data survei lama di laporan (tidak lagi ada di Info Umum). */
export const KATEGORI_OKUPANSI_OPTIONS: ChoiceOption[] = [
  { value: 'commercial', label: 'Commercial', desc: 'Mall, hotel, perkantoran, ruko, sekolah, RS' },
  { value: 'industrial', label: 'Industrial', desc: 'Pabrik, gudang, manufaktur' },
  { value: 'energy', label: 'Energy', desc: 'Pertambangan, oil & gas, power plant' },
];

// ============ CONSTRUCTION ============

/**
 * Kelas konstruksi — 1:1 prototipe: Kelas 1 Beton (8), Kelas 1 Baja (6),
 * Kelas 2 (4), Kelas 3 (3), Tidak ada informasi (nilai 4; value '2' agar
 * kompatibel dengan payload grading lama yang hanya mengenal 8/6/4/2).
 */
export const C_KELAS_OPTIONS: ChoiceOption[] = [
  { value: '8', label: 'Kelas 1 (Konstruksi Beton)', desc: 'Dinding, lantai, atap seluruhnya non-combustible, rangka beton bertulang', badge: 'Good (8)', tone: 'good' },
  { value: '6', label: 'Kelas 1 (Konstruksi Baja)', desc: 'Dinding, lantai, atap non-combustible, rangka struktur baja', badge: 'Average (6)', tone: 'avg' },
  { value: '4', label: 'Kelas 2', desc: 'Atap sirap kayu, dinding combustible ≤20%, lantai/struktur boleh kayu', badge: 'Marginal (4)', tone: 'marg' },
  { value: '3', label: 'Kelas 3', desc: 'Semua bangunan selain Kelas 1 & 2', badge: 'Poor (3)', tone: 'poor' },
  { value: '2', label: 'Tidak ada informasi', desc: 'Kelas konstruksi tidak dapat dipastikan saat survey', badge: 'Marginal (4)', tone: 'marg' },
];

export const C_PENALTY_OPTIONS: ChoiceOption[] = [
  { value: 'no', label: 'Tidak', badge: 'Tidak ada penalti', tone: 'good' },
  { value: 'yes', label: 'Ya', badge: 'Penalti turun 1 tingkat', tone: 'marg' },
];

// ============ OCCUPANCY ============

/**
 * Kategori hazard okupansi tidak lagi dipilih manual — skor diambil otomatis
 * dari Breakdown Okupansi ASWATA (lihat `OccupationBreakdownSelect`).
 * Opsi di bawah hanya cadangan tampilan untuk data lama.
 */
export const O_HAZARD_OPTIONS: ChoiceOption[] = [
  { value: '8', label: 'Low Hazard Non-Industrial', desc: 'Perkantoran, hotel, sekolah, RS, pertokoan (LHR-NI)', badge: 'Good (8)', tone: 'good' },
  { value: '6a', label: 'Low Hazard Industrial', desc: 'Manufaktur ringan, non-hazardous process/stock (LHR-I)', badge: 'Average (6)', tone: 'avg' },
  { value: '6b', label: 'Medium Hazard — Warehouse 29371', desc: 'Gudang dengan kode OJK 29371', badge: 'Average (6)', tone: 'avg' },
  { value: '4a', label: 'Warehouse (selain 29371)', desc: 'Gudang umum selain kode 29371', badge: 'Marginal (4)', tone: 'marg' },
  { value: '4b', label: 'High Hazard Risk', desc: 'MHR-1/2/3, proses/stok berbahaya, flammable', badge: 'Marginal (4)', tone: 'marg' },
  { value: '4c', label: 'Energy Hazard Risk', desc: 'Pertambangan, oil & gas, power plant, petrochemical', badge: 'Marginal (4)', tone: 'marg' },
];

export const O_KIMIA_OPTIONS: ChoiceOption[] = [
  { value: 'none', label: 'Tidak ada' },
  { value: 'small', label: 'Ada — jumlah kecil', desc: 'Tersimpan dengan SOP yang baik' },
  { value: 'large', label: 'Ada — jumlah besar', badge: 'Perlu perhatian khusus', tone: 'marg' },
];

// ============ PROTECTION ============
// Label 1:1 revisi prototipe (bobot baru: APAR 25%, Hidran 30%, Detektor 25%, Sprinkler 10%).

export const P_APAR_OPTIONS: ChoiceOption[] = [
  { value: 'good', label: 'Ada & Fungsional', desc: 'Jumlah cukup, tidak kadaluarsa, mudah diakses', badge: 'Average (6) max', tone: 'good' },
  { value: 'avg', label: 'Ada (dengan catatan)', desc: 'Jumlah kurang / ada yg kadaluarsa', badge: 'Penalti -1 tingkat', tone: 'avg' },
  { value: 'none', label: 'Tidak Ada', badge: 'Marginal/Poor', tone: 'marg' },
];

export const P_HIDRAN_OPTIONS: ChoiceOption[] = [
  { value: 'good', label: 'Ada & Fungsional', desc: 'Tekanan air cukup, akses baik', badge: 'Good (8)', tone: 'good' },
  { value: 'avg', label: 'Ada (dengan catatan)', badge: 'Penalti -1 tingkat', tone: 'avg' },
  { value: 'none', label: 'Tidak Ada', badge: 'Poor (2)', tone: 'marg' },
];

export const P_COMPONENT_OPTIONS: ChoiceOption[] = [
  { value: 'good', label: 'Ada & Fungsional', badge: 'Good (8)', tone: 'good' },
  { value: 'avg', label: 'Ada (dengan catatan)', badge: 'Penalti -1 tingkat', tone: 'avg' },
  { value: 'none', label: 'Tidak Ada', badge: 'Marginal/Poor', tone: 'marg' },
];

export const P_DAMKAR_OPTIONS: ChoiceOption[] = [
  { value: '8', label: '< 10 menit', badge: 'Good (8)', tone: 'good' },
  { value: '6', label: '10–20 menit', badge: 'Average (6)', tone: 'avg' },
  { value: '4', label: '20–30 menit', badge: 'Marginal (4)', tone: 'marg' },
  { value: '2', label: '> 30 menit', badge: 'Poor (2)', tone: 'poor' },
];

/** Ya / Tidak / Tidak Tahu — dipakai detail blok Hidran, Detektor, Sprinkler, dll. */
export const YA_TIDAK_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ya', label: 'Ya' },
  { value: 'tidak', label: 'Tidak' },
  { value: 'tidak_tahu', label: 'Tidak Tahu' },
];

export const P_AUTO_START_OPTIONS: Array<{ value: string; label: string }> = YA_TIDAK_OPTIONS;

export const P_COVERAGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '<30', label: '< 30%' },
  { value: '30-50', label: '30% - 50%' },
  { value: '50-80', label: '50% - 80%' },
  { value: '>80', label: '> 80%' },
];

export const DETECTOR_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'heat', label: 'Heat Detector' },
  { value: 'smoke', label: 'Smoke Detector' },
  { value: 'other', label: 'Lainnya' },
];

// ============ EXPOSURE ============

export const EX_KONDISI_OPTIONS: ChoiceOption[] = [
  { value: '4', label: 'Tidak ada fasilitas lain di sekitar dalam radius 100 m', desc: 'Berdiri sendiri, tidak ada fasilitas lain dalam radius 100 m', badge: 'Good (4)', tone: 'good' },
  { value: '3', label: 'Jarak memadai dengan fasilitas sekitar', desc: 'Ada bangunan lain tapi jarak cukup, risiko terkelola', badge: 'Average (3)', tone: 'avg' },
  { value: '2', label: 'Jarak tidak memadai', desc: 'Berdempetan dengan bangunan lain, potensi fire spread', badge: 'Marginal (2)', tone: 'marg' },
  { value: '1', label: 'Jarak tidak memadai + High/Energy Hazard di sekitar', desc: 'Risiko sangat tinggi dari lingkungan sekitar', badge: 'Poor (1)', tone: 'poor' },
];

// ============ NATURAL HAZARDS (revisi: Gempa + Banjir + Petir) ============

/** Penangkal petir — 2 pilihan sesuai revisi prototipe. */
export const NH_PETIR_OPTIONS: ChoiceOption[] = [
  { value: 'avg', label: 'Terpasang penangkal petir', badge: 'Average', tone: 'avg' },
  { value: 'marg', label: 'Tanpa penangkal petir', badge: 'Marginal', tone: 'marg' },
];

/** 5 kriteria Banjir — semuanya harus "Ya" untuk rating Average. */
export const NH_FLOOD_CRITERIA: Array<{ key: string; label: string }> = [
  { key: 'loss', label: 'Tidak pernah ada loss terkait banjir selama 5 tahun terakhir' },
  { key: 'prone', label: 'Tidak terletak di flood prone area' },
  { key: 'river', label: 'Berjarak lebih dari 100 m dari sungai' },
  { key: 'elev', label: 'Elevasi bangunan tidak lebih rendah daripada jalan' },
  { key: 'hill', label: 'Tidak terletak di area perbukitan' },
];

export const YES_NO_OPTIONS: ChoiceOption[] = [
  { value: 'yes', label: 'Ya' },
  { value: 'no', label: 'Tidak' },
];

// ============ LOSS ESTIMATE (revisi: Pemisah + Jumlah Bangunan) ============

/** Ada Pemisah Antar Bangunan — penilaian masih TBC (hanya ketersediaan). */
export const LE_PEMISAH_OPTIONS: ChoiceOption[] = [
  { value: 'yes', label: 'Ada' },
  { value: 'no', label: 'Tidak ada' },
];

/** Jumlah Bangunan — semua jawaban memicu rating Marginal (revisi prototipe). */
export const LE_JML_BANGUNAN_OPTIONS: ChoiceOption[] = [
  { value: '1', label: '1 bangunan', badge: 'Rating: Marginal', tone: 'marg' },
  { value: 'gt1', label: '> 1 bangunan', badge: 'Rating: Marginal', tone: 'marg' },
];

export const OP_ADA_OPTIONS: ChoiceOption[] = [
  { value: 'no', label: 'Tidak ada catatan khusus', badge: 'Average (3) — default', tone: 'avg' },
  { value: 'yes', label: 'Ada catatan khusus', desc: 'Pencurian, kerusuhan, sabotase, dll' },
];
