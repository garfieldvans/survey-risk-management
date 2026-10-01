/**
 * Definisi field wizard survey (port reff.html) — dipakai bersama oleh
 * SurveyorNewSurvey (form input) dan SurveyDetail (render ringkasan jawaban).
 */

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'yesno' | 'check';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  hint?: string;
  /** 2 = ditempatkan berpasangan dalam satu baris (`.grid-2` di reff.html). */
  cols?: 1 | 2;
};

export type FieldGroup = { title?: string; tip?: string; hint?: string; fields: FieldDef[] };

// Grup & urutan pertanyaan 1:1 dari Section 1 reff.html (Survey Umum A–F).
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
    title: 'B. Bangunan & Lingkungan Sekitar',
    fields: [
      { key: 'jml_bangunan', label: 'Jumlah Bangunan di Lokasi', type: 'number', placeholder: 'Contoh: 2', cols: 2 },
      { key: 'pemisah', label: 'Ada Pemisah Antar Bangunan (Fire Wall / Jarak Aman)?', type: 'yesno', cols: 2 },
      { key: 'lingk_depan', label: 'Lingkungan Depan', type: 'text', placeholder: 'Depan: ...', cols: 2 },
      { key: 'lingk_belakang', label: 'Lingkungan Belakang', type: 'text', placeholder: 'Belakang: ...', cols: 2 },
      { key: 'lingk_kiri', label: 'Lingkungan Kiri', type: 'text', placeholder: 'Kiri: ...', cols: 2 },
      { key: 'lingk_kanan', label: 'Lingkungan Kanan', type: 'text', placeholder: 'Kanan: ...', cols: 2 },
    ],
    hint: 'Contoh isian: "tanah kosong", "permukiman warga", "jalan raya", "pabrik lain", dst.',
  },
  {
    title: 'C. Sistem Proteksi Kebakaran (Ketersediaan)',
    tip: '📌 Ini pertanyaan ketersediaan/deskripsi. Penilaian skor proteksi ada di tahap terpisah (Protection).',
    fields: [
      {
        key: 'proteksi',
        label: 'Sistem proteksi yang tersedia',
        type: 'check',
        options: [
          { value: 'apar', label: 'APAR (Alat Pemadam Api Ringan) tersedia dan tersebar merata' },
          { value: 'hidran', label: 'Hidran (indoor/outdoor) tersedia' },
          { value: 'detektor', label: 'Detektor asap/panas otomatis tersedia' },
          { value: 'sprinkler', label: 'Sistem sprinkler otomatis tersedia' },
          { value: 'alarm', label: 'Sistem alarm manual / panel kontrol kebakaran tersedia' },
        ],
      },
      { key: 'sumber_air', label: 'Sumber Air untuk Pemadaman', type: 'text', placeholder: 'Contoh: tangki bawah tanah, PDAM, sumur', cols: 2 },
      { key: 'jarak_damkar', label: 'Jarak & Waktu Tempuh ke Pos Damkar Terdekat', type: 'text', placeholder: 'Contoh: 10 km / ± 15 menit', cols: 2 },
    ],
  },
  {
    title: 'D. Manajemen Keselamatan & Tanggap Darurat',
    fields: [
      { key: 'k3', label: 'Ada Unit/Petugas K3 atau Safety Officer?', type: 'yesno', cols: 2 },
      {
        key: 'pelatihan',
        label: 'Frekuensi Pelatihan Tanggap Darurat / Fire Drill',
        type: 'select',
        options: [
          { value: 'rutin', label: 'Rutin (≥1x/tahun)' },
          { value: 'jarang', label: 'Jarang / tidak terjadwal' },
          { value: 'none', label: 'Belum pernah' },
        ],
        cols: 2,
      },
      { key: 'evakuasi', label: 'Ada Prosedur Evakuasi & Jalur Evakuasi Tertulis?', type: 'yesno', cols: 2 },
      { key: 'hotwork', label: 'Ada Izin Kerja Panas (Hot Work Permit)?', type: 'yesno', cols: 2 },
    ],
  },
  {
    title: 'E. Keamanan Lokasi',
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
  {
    title: 'F. Riwayat Kerugian (Loss History)',
    fields: [
      { key: 'klaim_ada', label: 'Pernah Ada Klaim Asuransi 5 Tahun Terakhir?', type: 'yesno', cols: 2 },
      { key: 'klaim_jenis', label: 'Jika pernah, jenis peril / penyebab', type: 'text', placeholder: 'Contoh: kebakaran, banjir, pencurian', cols: 2 },
      { key: 'klaim_ringkasan', label: 'Ringkasan Kejadian & Tindak Lanjut / Perbaikan yang Dilakukan', type: 'textarea', placeholder: 'Ceritakan singkat kejadian dan langkah perbaikan (risk improvement) yang sudah dilakukan...' },
    ],
  },
];

export const OCC_BLOCKS: Record<string, { label: string; tip?: string; fields: FieldDef[] }> = {
  warehouse: {
    label: '🏬 Gudang / Warehouse',
    fields: [
      {
        key: 'wh_racking',
        label: 'Sistem Racking / Rak Penyimpanan',
        type: 'select',
        options: [
          { value: 'none', label: 'Tidak ada, ditumpuk lantai' },
          { value: 'low', label: 'Rak rendah (<3 m)' },
          { value: 'high', label: 'Rak tinggi (≥3 m / high-rise racking)' },
        ],
        cols: 2,
      },
      { key: 'wh_tinggi', label: 'Estimasi Tinggi Tumpukan Barang Maksimum', type: 'text', placeholder: 'Contoh: 4 meter', cols: 2 },
      { key: 'wh_barang', label: 'Kategori Barang yang Disimpan', type: 'text', placeholder: 'Contoh: bahan makanan kemasan, tekstil, elektronik, bahan kimia' },
      { key: 'wh_cold', label: 'Ada Area Cold Storage / Freezer?', type: 'yesno', cols: 2 },
      { key: 'wh_forklift', label: 'Ada Aktivitas Charging Forklift Baterai di Dalam Gedung?', type: 'yesno', cols: 2 },
      { key: 'wh_dock', label: 'Jumlah Pintu Loading Dock', type: 'number', placeholder: '0', cols: 2 },
      {
        key: 'wh_penataan',
        label: 'Sistem Penataan Barang',
        type: 'select',
        options: [
          { value: 'fifo', label: 'FIFO / FEFO tertata rapi' },
          { value: 'acak', label: 'Tidak tertata / acak' },
        ],
        cols: 2,
      },
    ],
  },
  manufaktur: {
    label: '🏭 Pabrik / Manufaktur',
    fields: [
      { key: 'mf_mesin', label: 'Jenis Mesin Produksi Utama & Sumber Energi', type: 'text', placeholder: 'Contoh: mesin injeksi plastik - listrik, boiler - gas' },
      { key: 'mf_panas', label: 'Ada Proses dengan Panas / Api Terbuka?', type: 'yesno', cols: 2 },
      { key: 'mf_debu', label: 'Ada Potensi Debu Mudah Meledak (Dust Explosion)?', type: 'yesno', cols: 2 },
      { key: 'mf_boiler', label: 'Ada Boiler / Genset Besar?', type: 'text', placeholder: 'Kapasitas & lokasi, jika ada', cols: 2 },
      { key: 'mf_kimia', label: 'Ada Penyimpanan Bahan Kimia / Cairan Mudah Terbakar?', type: 'yesno', cols: 2 },
      { key: 'mf_msds', label: 'MSDS (Material Safety Data Sheet) Tersedia untuk Bahan Berbahaya?', type: 'yesno', cols: 2 },
    ],
  },
  kantor: {
    label: '🏢 Perkantoran',
    fields: [
      { key: 'kt_kapasitas', label: 'Jumlah Lantai & Estimasi Kapasitas Orang', type: 'text', placeholder: 'Contoh: 10 lantai, ±500 orang', cols: 2 },
      { key: 'kt_server', label: 'Ada Ruang Server / Data Center?', type: 'yesno', cols: 2 },
      { key: 'kt_fm200', label: 'Jika ada ruang server, proteksi kebakaran khusus (gas/FM200) tersedia?', type: 'yesno' },
      { key: 'kt_lift', label: 'Jumlah Lift & Tangga Darurat', type: 'text', placeholder: 'Contoh: 4 lift, 2 tangga darurat', cols: 2 },
      {
        key: 'kt_parkir',
        label: 'Lokasi Area Parkir',
        type: 'select',
        options: [
          { value: 'basement', label: 'Basement gedung' },
          { value: 'terpisah', label: 'Gedung terpisah' },
          { value: 'luar', label: 'Area terbuka' },
        ],
        cols: 2,
      },
    ],
  },
  retail: {
    label: '🛍️ Retail / Mall / Pertokoan',
    fields: [
      { key: 'rt_tenant', label: 'Jumlah Tenant / Unit Usaha di Dalamnya', type: 'number', placeholder: '0', cols: 2 },
      { key: 'rt_foodcourt', label: 'Ada Area Food Court dengan Kompor/LPG?', type: 'yesno', cols: 2 },
      { key: 'rt_eskalator', label: 'Ada Eskalator / Lift Penumpang?', type: 'yesno', cols: 2 },
      { key: 'rt_parkir', label: 'Kapasitas Area Parkir (kendaraan)', type: 'number', placeholder: '0', cols: 2 },
      { key: 'rt_ramai', label: 'Estimasi Jam/Hari Kunjungan Tersibuk (potensi evakuasi massal)', type: 'text', placeholder: 'Contoh: akhir pekan sore hari, jam makan siang' },
    ],
  },
  hotel: {
    label: '🏨 Hotel / Resort',
    fields: [
      { key: 'ht_kamar', label: 'Jumlah Kamar & Lantai', type: 'text', placeholder: 'Contoh: 120 kamar, 8 lantai', cols: 2 },
      { key: 'ht_dapur', label: 'Ada Dapur Komersial (Central Kitchen)?', type: 'yesno', cols: 2 },
      { key: 'ht_hood', label: 'Jika ada dapur, apakah ada exhaust hood & sistem pemadam khusus dapur?', type: 'yesno' },
      {
        key: 'ht_gas',
        label: 'Sumber Gas untuk Dapur',
        type: 'select',
        options: [
          { value: 'lpg_tabung', label: 'LPG tabung per unit' },
          { value: 'lpg_sentral', label: 'Tangki LPG sentral' },
          { value: 'gas_kota', label: 'Gas kota / PGN' },
          { value: 'none', label: 'Tidak menggunakan gas' },
        ],
        cols: 2,
      },
      { key: 'ht_lighting', label: 'Emergency Lighting & Signage di Koridor Kamar Berfungsi?', type: 'yesno', cols: 2 },
    ],
  },
  kesehatan: {
    label: '🏥 Rumah Sakit / Klinik',
    fields: [
      { key: 'rs_bed', label: 'Jumlah Tempat Tidur', type: 'number', placeholder: '0', cols: 2 },
      { key: 'rs_oksigen', label: 'Ada Sistem Gas Medis / Oksigen Sentral?', type: 'yesno', cols: 2 },
      { key: 'rs_genset', label: 'Ada Genset Backup untuk Ruang Operasi/ICU?', type: 'yesno', cols: 2 },
      { key: 'rs_radiologi', label: 'Ada Ruang Radiologi (X-Ray/CT) dengan Proteksi Khusus?', type: 'yesno', cols: 2 },
      { key: 'rs_limbah', label: 'Penanganan Limbah Medis', type: 'text', placeholder: 'Contoh: pihak ketiga berizin, insinerator sendiri' },
    ],
  },
  lainnya: {
    label: '📦 Lainnya',
    tip: 'Jenis okupansi ini belum memiliki checklist khusus. Isi deskripsi manual di bawah — daftar pertanyaan spesifiknya perlu didiskusikan dan ditambahkan bersama tim Risk Engineering.',
    fields: [
      { key: 'lainnya_desc', label: 'Deskripsi Jenis Usaha & Hal Khusus yang Perlu Diperhatikan', type: 'textarea', placeholder: 'Jelaskan jenis usaha dan risiko spesifiknya...' },
    ],
  },
};

/** Konversi nilai mentah jadi label yang enak dibaca untuk ringkasan. */
export function fieldValueLabel(field: FieldDef, raw: string): string {
  const v = (raw ?? '').trim();
  if (v === '') return '';
  if (field.type === 'yesno') return v === 'yes' ? 'Ada' : v === 'no' ? 'Tidak ada' : v;
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
