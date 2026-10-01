import type { ChoiceOption } from '../components/survey/ChoiceGroup';

/** Opsi penilaian tiap seksi grading — teks & badge 1:1 dari reff.html. */

export const M_CHECKLIST_ITEMS = [
  { id: 'm1', label: 'Kebersihan dan kerapihan — Lokasi terlihat bersih dan rapi secara visual' },
  { id: 'm2', label: 'Aturan merokok — Ada larangan merokok, tidak nampak puntung rokok di area berisiko' },
  { id: 'm3', label: 'Pelatihan kebakaran — Diadakan minimal 1x per tahun, ada bukti/dokumentasi' },
  { id: 'm4', label: 'Perawatan rutin — Ada program perawatan bangunan, listrik, dan mesin secara berkala' },
  { id: 'm5', label: 'Housekeeping baik — Tidak ada penumpukan sampah/material di area berbahaya' },
  { id: 'm6', label: 'K3 terpenuhi — Ada rambu keselamatan, APD tersedia, jalur evakuasi jelas' },
];

export const M_KLAIM_OPTIONS: ChoiceOption[] = [
  { value: '0', label: '0 klaim', badge: 'Tidak ada penalti', tone: 'good' },
  { value: '1-2', label: '1–2 klaim', badge: 'Perhatian', tone: 'avg' },
  { value: '3+', label: '≥ 3 klaim', badge: 'Penalti turun 1 tingkat', tone: 'marg' },
];

export const M_IMPROVEMENT_OPTIONS: ChoiceOption[] = [
  { value: 'yes', label: '✅ Sudah dilakukan', badge: 'Kredit naik 1 tingkat', tone: 'good' },
  { value: 'no', label: '❌ Belum / Tidak ada klaim', badge: 'Tidak ada kredit', tone: 'avg' },
];

export const M_REKOMENDASI_OPTIONS: ChoiceOption[] = [
  { value: 'yes', label: '✅ Ya', badge: 'Kredit naik 1 tingkat', tone: 'good' },
  { value: 'no', label: '❌ Tidak / Belum ada rekomendasi', badge: 'Tidak ada kredit', tone: 'avg' },
];

export const C_KELAS_OPTIONS: ChoiceOption[] = [
  { value: '8', label: 'Kelas 1 — Permanen', desc: 'Beton/bata penuh, atap beton/genteng', badge: 'Good (8)', tone: 'good' },
  { value: '6', label: 'Kelas 2 — Semi Permanen', desc: 'Campuran beton & material ringan', badge: 'Average (6)', tone: 'avg' },
  { value: '4', label: 'Kelas 3 — Non Permanen', desc: 'Kayu, rangka baja ringan, material mudah terbakar', badge: 'Marginal (4)', tone: 'marg' },
  { value: '2', label: 'Kelas 3 — Kondisi Buruk', desc: 'Material tidak layak, kondisi rusak parah', badge: 'Poor (2)', tone: 'poor' },
];

export const C_PENALTY_OPTIONS: ChoiceOption[] = [
  { value: 'no', label: 'Tidak', badge: 'Tidak ada penalti', tone: 'good' },
  { value: 'yes', label: 'Ya', badge: 'Penalti turun 1 tingkat', tone: 'marg' },
];

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

export const O_DAPUR_OPTIONS: ChoiceOption[] = [
  { value: 'no', label: 'Tidak ada' },
  { value: 'yes', label: 'Ada', desc: 'Wajib foto: kitchen hood, duct, LPG', badge: 'Perlu checklist tambahan', tone: 'avg' },
];

export const O_FORKLIFT_OPTIONS: ChoiceOption[] = [
  { value: 'no', label: 'Tidak ada' },
  { value: 'yes', label: 'Ada', badge: 'Risiko kebakaran baterai', tone: 'marg' },
];

export const P_APAR_OPTIONS: ChoiceOption[] = [
  { value: 'good', label: 'Ada & Fungsional', desc: 'Jumlah cukup, tidak kadaluarsa, mudah diakses', badge: 'Average (6) max', tone: 'good' },
  { value: 'avg', label: 'Ada, ada catatan', desc: 'Jumlah kurang / ada yg kadaluarsa', badge: 'Penalti -1 tingkat', tone: 'avg' },
  { value: 'none', label: 'Tidak Ada', badge: 'Marginal/Poor', tone: 'marg' },
];

export const P_HIDRAN_OPTIONS: ChoiceOption[] = [
  { value: 'good', label: 'Ada & Fungsional', desc: 'Tekanan air cukup, akses baik', badge: 'Good (8)', tone: 'good' },
  { value: 'avg', label: 'Ada, ada catatan', badge: 'Penalti -1 tingkat', tone: 'avg' },
  { value: 'none', label: 'Tidak Ada', badge: 'Marginal/Poor', tone: 'marg' },
];

export const P_COMPONENT_OPTIONS: ChoiceOption[] = [
  { value: 'good', label: 'Ada & Fungsional', badge: 'Good (8)', tone: 'good' },
  { value: 'avg', label: 'Ada, ada catatan', badge: 'Penalti -1 tingkat', tone: 'avg' },
  { value: 'none', label: 'Tidak Ada', badge: 'Marginal/Poor', tone: 'marg' },
];

export const P_DAMKAR_OPTIONS: ChoiceOption[] = [
  { value: '8', label: '< 10 menit', badge: 'Good (8)', tone: 'good' },
  { value: '6', label: '10–20 menit', badge: 'Average (6)', tone: 'avg' },
  { value: '4', label: '21–30 menit', badge: 'Marginal (4)', tone: 'marg' },
  { value: '2', label: '> 30 menit', badge: 'Poor (2)', tone: 'poor' },
];

export const EX_KONDISI_OPTIONS: ChoiceOption[] = [
  { value: '4', label: 'Tidak ada fasilitas lain di sekitar', desc: 'Berdiri sendiri, tidak ada risiko dari lingkungan', badge: 'Good (4)', tone: 'good' },
  { value: '3', label: 'Jarak memadai dengan fasilitas sekitar', desc: 'Ada bangunan lain tapi jarak cukup, risiko terkelola', badge: 'Average (3)', tone: 'avg' },
  { value: '2', label: 'Jarak tidak memadai', desc: 'Berdempetan dengan bangunan lain, potensi fire spread', badge: 'Marginal (2)', tone: 'marg' },
  { value: '1', label: 'Jarak tidak memadai + High/Energy Hazard di sekitar', desc: 'Risiko sangat tinggi dari lingkungan sekitar', badge: 'Poor (1)', tone: 'poor' },
];

export const NH_GEMPA_OPTIONS: ChoiceOption[] = [
  { value: 'avg', label: 'Max MMI VII atau kurang', desc: 'Zona risiko rendah-menengah', badge: 'Average', tone: 'avg' },
  { value: 'marg', label: 'MMI VIII atau lebih', desc: 'Zona risiko gempa tinggi', badge: 'Marginal — High Risk', tone: 'marg' },
];

export const NH_TSUNAMI_OPTIONS: ChoiceOption[] = [
  { value: 'avg', label: 'Tidak di area return period tsunami', badge: 'Average', tone: 'avg' },
  { value: 'marg', label: 'Berada di area return period tsunami', badge: 'Marginal', tone: 'marg' },
];

export const NH_PETIR_OPTIONS: ChoiceOption[] = [
  { value: 'avg_low', label: 'IKL Rendah (< 40)', badge: 'Average', tone: 'avg' },
  { value: 'avg_high', label: 'IKL Tinggi (≥ 40) + Ada Lightning Arrester', badge: 'Average', tone: 'avg' },
  { value: 'marg', label: 'IKL Tinggi (≥ 40) + Tanpa Lightning Arrester', badge: 'Marginal', tone: 'marg' },
];

export const NH_BANJIR_OPTIONS: ChoiceOption[] = [
  { value: 'avg', label: 'Return period ≥ 200 tahun', desc: 'Elevasi lebih tinggi, jarak ≥ 15m dari sungai', badge: 'Average', tone: 'avg' },
  { value: 'marg', label: 'Return period < 200 tahun / dekat sungai', desc: 'Rawan banjir atau elevasi rendah', badge: 'Marginal', tone: 'marg' },
];

export const NH_LONGSOR_OPTIONS: ChoiceOption[] = [
  { value: 'avg', label: 'Tanah datar, kemiringan ≤ 20°', badge: 'Average', tone: 'avg' },
  { value: 'marg', label: 'Kemiringan > 20° atau area rawan longsor', badge: 'Marginal', tone: 'marg' },
];

export const NH_HISTORY_OPTIONS: ChoiceOption[] = [
  { value: 'none', label: 'Tidak ada riwayat', badge: 'Average', tone: 'avg' },
  { value: 'improved', label: 'Ada + Sudah ada risk improvement', badge: 'Marginal', tone: 'marg' },
  { value: 'none_improved', label: 'Ada + Belum ada improvement', badge: 'Poor', tone: 'poor' },
];

export const LE_MFL_OPTIONS: ChoiceOption[] = [
  { value: '7', label: '< 25% nilai pertanggungan', badge: 'Excellent (7)', tone: 'good' },
  { value: '7b', label: '25–50% nilai pertanggungan', badge: 'Good (7)', tone: 'good' },
  { value: '5', label: '51–75% nilai pertanggungan', badge: 'Average (5)', tone: 'avg' },
  { value: '3', label: '75–100% nilai pertanggungan', badge: 'Marginal (3)', tone: 'marg' },
];

export const OP_ADA_OPTIONS: ChoiceOption[] = [
  { value: 'no', label: 'Tidak ada catatan khusus', badge: 'Average (3) — default', tone: 'avg' },
  { value: 'yes', label: 'Ada catatan khusus', desc: 'Pencurian, kerusuhan, sabotase, dll' },
];

/** Kategori okupansi kasar di langkah Info Umum (`.radio-grid` reff.html). */
export const KATEGORI_OKUPANSI_OPTIONS: ChoiceOption[] = [
  { value: 'commercial', label: 'Commercial', desc: 'Mall, hotel, perkantoran, ruko, sekolah, RS' },
  { value: 'industrial', label: 'Industrial', desc: 'Pabrik, gudang, manufaktur' },
  { value: 'energy', label: 'Energy', desc: 'Pertambangan, oil & gas, power plant' },
];
