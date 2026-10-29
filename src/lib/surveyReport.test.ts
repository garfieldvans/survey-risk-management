import { describe, expect, it } from 'vitest';
import type { Survey } from '../api/types';
import {
  buildRiskGradingHtml,
  buildSurveyReportHtml,
  reportFileSuffix,
  surveyToReportInput,
} from './surveyReport';

/** Input penilaian yang menghasilkan total 38 (AVERAGE): 6+6+6+8+3+3+3+3. */
const GRADE_INPUTS = {
  mAnswers: { m1: 'yes', m2: 'yes', m3: 'yes', m4: 'yes', m7: 'no' },
  mKlaim: '0',
  mImprovement: '',
  mRekomendasi: '',
  cKelas: '6',
  cSandwich: 'no',
  cAcp: 'no',
  oHazard: '6a',
  pApar: 'good',
  pHidran: 'good',
  pDetektor: 'good',
  pSprinkler: 'good',
  pDamkar: '8',
  exKondisi: '3',
  nhGempa: 'avg',
  nhBanjir: 'avg',
  nhPetir: 'avg',
  lePemisah: '',
  leJmlBangunan: '1',
  tsi: 500000000,
  cLantai: 3,
  spJenis: 'pabrik',
  oHazardCat: 'mhr3',
};

function makeSurvey(propertyOverrides: Partial<Survey['property']> = {}): Survey {
  return {
    id: 's1',
    propertyId: 'p1',
    surveyorId: 'u1',
    status: 'APPROVED',
    surveyDate: '2026-10-15',
    notes: 'Deskripsi aktivitas utama: Pabrik karet\n\nCatatan akhir.',
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-15T08:00:00.000Z',
    property: {
      id: 'p1',
      name: 'PT Maju Jaya',
      address: 'Jl. Merdeka No. 1',
      ownerName: 'Budi Santoso',
      occupationId: 'o1',
      extraData: {
        merk: 'Maju Mart',
        kota: 'Jakarta Pusat',
        kodePos: '10110',
        gps: '-6.2,106.8',
        pelaksana: 'Andi Wijaya',
        marketing: 'Cabang Jakarta',
        pic: 'Sari',
        tsi: 500000000,
        jenisOkupansi: 'pabrik',
        general: { gu_pemilik: 'Budi Santoso' },
        special: { sp_produksi: 'Karet' },
        gradeInputs: GRADE_INPUTS,
        occupancyDesc: 'Pabrik karet',
        uploadNotes: 'Foto kondisi terkini',
        gempaZone: '3',
        lossRows: [
          { kategori: 'Kebakaran', tanggal: '2026-01-01', cause: 'Korsleting', amount: '10000000' },
        ],
        facilities: [{ nama: 'APAR', arah: 'Utara', jarak: '10' }],
        gradeNotes: { construction: 'Catatan konstruksi' },
      },
      ...propertyOverrides,
    },
    attachments: [
      {
        id: 'a1',
        surveyId: 's1',
        fileName: 'foto-depan.jpg',
        fileKey: 'uploads/foto-depan.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 2048,
        kind: 'photo',
        createdAt: '2026-10-15T08:00:00.000Z',
      },
    ],
  };
}

describe('reportFileSuffix', () => {
  it('menjadikan nama aman untuk nama file PDF', () => {
    expect(reportFileSuffix('PT Maju Jaya')).toBe('PT_Maju_Jaya');
    expect(reportFileSuffix('PT. Maju & Jaya!')).toBe('PT_Maju_Jaya');
    expect(reportFileSuffix('  1234  ')).toBe('1234');
  });

  it('fallback bila tidak ada karakter aman', () => {
    expect(reportFileSuffix('')).toBe('Tertanggung');
    expect(reportFileSuffix('///')).toBe('Tertanggung');
  });
});

describe('surveyToReportInput', () => {
  const input = surveyToReportInput(makeSurvey());

  it('mengambil identitas objek dari property & extraData', () => {
    expect(input.info.tertanggung).toBe('PT Maju Jaya');
    expect(input.info.merk).toBe('Maju Mart');
    expect(input.info.kota).toBe('Jakarta Pusat');
    expect(input.info.tsi).toBe('500000000');
    expect(input.info.surveyDate).toBe('2026-10-15');
    expect(input.info.pelaksana).toBe('Andi Wijaya');
  });

  it('membawa nama lampiran sesuai urutan upload', () => {
    expect(input.uploadNames).toEqual(['foto-depan.jpg']);
  });

  it('jenis okupansi & field khusus ikut terbawa', () => {
    expect(input.spJenis).toBe('pabrik');
    expect(input.special.sp_produksi).toBe('Karet');
    expect(input.general.gu_pemilik).toBe('Budi Santoso');
  });

  it('menghitung ulang skor dari gradeInputs tersimpan', () => {
    expect(input.result.total).toBe(6 + 6 + 6 + 8 + 3 + 3 + 3 + 3);
    expect(input.result.total).toBe(38);
    expect(input.result.category).toBe('AVERAGE');
    expect(input.result.scores.management).toBe(6);
    expect(input.result.scores.protection).toBe(8);
  });

  it('memetakan tabel loss & fasilitas', () => {
    expect(input.lossRows).toEqual([
      { kategori: 'Kebakaran', tanggal: '2026-01-01', cause: 'Korsleting', amount: '10000000' },
    ]);
    expect(input.facilities).toEqual([{ nama: 'APAR', arah: 'Utara', jarak: '10' }]);
  });

  it('menghapus prefix "Deskripsi aktivitas utama" dari catatan akhir', () => {
    expect(input.occupancyDesc).toBe('Pabrik karet');
    expect(input.finalNotes).toBe('Catatan akhir.');
  });

  it('extraData kosong/tidak lengkap tidak membuat crash', () => {
    const bare = makeSurvey({ extraData: null });
    const bareInput = surveyToReportInput(bare);
    expect(bareInput.info.tertanggung).toBe('PT Maju Jaya');
    expect(bareInput.uploadNames).toEqual(['foto-depan.jpg']);
    expect(bareInput.lossRows).toEqual([]);
    expect(bareInput.result.total).toBeGreaterThanOrEqual(0);
    expect(buildSurveyReportHtml(bareInput)).toContain('PT Maju Jaya');
  });

  it('tanpa tanggal survey memakai createdAt', () => {
    const noDate = makeSurvey();
    noDate.surveyDate = null;
    expect(surveyToReportInput(noDate).info.surveyDate).toBe('2026-10-15');
  });
});

describe('buildSurveyReportHtml', () => {
  const input = surveyToReportInput(makeSurvey());
  const html = buildSurveyReportHtml(input);

  it('berbentuk dokumen HTML lengkap', () => {
    expect(html.startsWith('<html')).toBe(true);
    expect(html.endsWith('</html>')).toBe(true);
    expect(html).toContain('<title>');
    expect(html).toContain('<style>');
  });

  it('memuat data objek, lampiran, dan format Rupiah TSI', () => {
    expect(html).toContain('PT Maju Jaya');
    expect(html).toContain('Jl. Merdeka No. 1');
    expect(html).toContain('foto-depan.jpg');
    expect(html).toContain('Rp 500,000,000');
    expect(html).toContain('Jakarta Pusat');
  });

  it('menandai isian kosong sebagai "Belum dijawab"', () => {
    // mRekomendasi, lePemisah, dan beberapa field GU sengaja kosong
    expect(html).toContain('Belum dijawab');
  });

  it('ikut mencetak bagian essay/catatan', () => {
    expect(html).toContain('Catatan konstruksi');
    expect(html).toContain('Catatan akhir.');
    expect(html).toContain('Foto kondisi terkini');
  });

  it('me-escape konten berbahaya dari data survei', () => {
    const evil = makeSurvey({ name: 'Mall <script>alert(1)</script>' });
    const evilHtml = buildSurveyReportHtml(surveyToReportInput(evil));
    expect(evilHtml).toContain('&lt;script&gt;');
    expect(evilHtml).not.toContain('<script>alert(1)</script>');
  });
});

describe('buildRiskGradingHtml', () => {
  const input = surveyToReportInput(makeSurvey());
  const html = buildRiskGradingHtml(input);

  it('memuat judul, kategori, dan total skor', () => {
    expect(html).toContain('Risk Grading');
    expect(html).toContain('PT Maju Jaya');
    expect(html).toContain('AVERAGE');
    expect(html).toContain('38 / 55 poin');
  });

  it('memuat tabel 8 item + TOTAL + skala penilaian', () => {
    expect(html).toContain('Management');
    expect(html).toContain('Construction');
    expect(html).toContain('Loss Estimate');
    expect(html).toContain('TOTAL');
    expect(html).toContain('Skala Penilaian');
    expect(html).toContain('46–55 poin = GOOD');
  });

  it('rating per item mengikuti skornya', () => {
    // management 6 → Average, construction 6 → Average, exposure 3 → Marginal
    expect(html).toContain('Average');
    expect(html).toContain('Marginal');
  });
});
