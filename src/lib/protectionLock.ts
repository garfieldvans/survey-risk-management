/**
 * Logika kunci jawaban "Ada & Fungsional" pada tab Protection —
 * port dari `refreshProtectionFunctionalLock` + `PROTECTION_DETAIL_RULES`
 * di prototipe `Surver_Report__Revisi_Terbaru.html` (SURVEY_HTML_B64).
 *
 * Aturan (poin review #8): selama pertanyaan lanjutan salah satu komponen
 * berjawab "Tidak" / "Tidak Tahu", pilihan "Ada & Fungsional" untuk komponen
 * tersebut terkunci (dan status otomatis turun ke "Ada (dengan catatan)").
 * Selama tidak ada jawaban negatif, "Ada & Fungsional" tetap bisa dipilih.
 */

export type ProtectionType = 'hidran' | 'detektor' | 'sprinkler';

interface ProtectionRule {
  /** Field detail yang wajib terisi saat status "Ada" (good/avg). */
  requiredFields: string[];
  /** Dropdown pertanyaan lanjutan yang nilainya "Ya" = positif. */
  positiveDropdowns: string[];
  /** Group checkbox yang minimal harus ada satu terpilih. */
  checkboxGroups: string[][];
}

export const PROTECTION_DETAIL_RULES: Record<ProtectionType, ProtectionRule> = {
  hidran: {
    requiredFields: [
      'p_hidran_indoor',
      'p_hidran_outdoor',
      'p_jockey_qty',
      'p_jockey_cap',
      'p_jockey_auto',
      'p_mainpump_qty',
      'p_mainpump_cap',
      'p_mainpump_auto',
      'p_dieselpump_qty',
      'p_dieselpump_cap',
      'p_dieselpump_auto',
      'p_hidran_water_cap',
    ],
    positiveDropdowns: ['p_jockey_auto', 'p_mainpump_auto', 'p_dieselpump_auto'],
    checkboxGroups: [],
  },
  detektor: {
    requiredFields: ['p_det_normal', 'p_det_coverage', 'p_det_area'],
    positiveDropdowns: ['p_det_normal'],
    checkboxGroups: [['p_det_jenis']],
  },
  sprinkler: {
    requiredFields: ['p_spr_water_same', 'p_spr_coverage', 'p_spr_area'],
    positiveDropdowns: ['p_spr_water_same'],
    checkboxGroups: [],
  },
};

/** `Tidak` / `Tidak Tahu` pada pertanyaan lanjutan = jawaban negatif. */
function isNegativeValue(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  return normalized === 'tidak' || normalized === 'tidak_tahu';
}

export interface ProtectionDetailState {
  /** Seluruh field detail terisi dan group checkbox terpilih. */
  complete: boolean;
  /** Ada minimal satu pertanyaan lanjutan berjawab Tidak / Tidak Tahu. */
  hasNegative: boolean;
  missingFields: string[];
}

export function protectionDetailState(
  type: ProtectionType,
  special: Record<string, string>,
): ProtectionDetailState {
  const rules = PROTECTION_DETAIL_RULES[type];
  const missingFields = rules.requiredFields.filter((key) => !(special[key] ?? '').trim());
  const incompleteGroups = rules.checkboxGroups.filter(
    (group) => !group.some((key) => (special[key] ?? '').trim()),
  );
  const hasNegative = rules.positiveDropdowns.some((key) => isNegativeValue(special[key] ?? ''));
  return {
    complete: missingFields.length === 0 && incompleteGroups.length === 0,
    hasNegative,
    missingFields,
  };
}

/**
 * Kunci pilihan "Ada & Fungsional" (value 'good') untuk satu komponen proteksi.
 * Terkunci selama ada jawaban lanjutan Tidak / Tidak Tahu.
 */
export function protectionGoodLocked(
  type: ProtectionType,
  special: Record<string, string>,
): boolean {
  return protectionDetailState(type, special).hasNegative;
}
