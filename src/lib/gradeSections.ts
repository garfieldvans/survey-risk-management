import type { GradeItemCode } from '../shared';

export interface GradeSectionMeta {
  no: string;
  name: string;
  /** Bobot kategori: I, II, atau III (lihat tabel hasil di reff.html). */
  bobot: 'I' | 'II' | 'III';
}

export const GRADE_SECTION_META: Record<GradeItemCode, GradeSectionMeta> = {
  management: { no: '1', name: 'Management', bobot: 'I' },
  construction: { no: '2', name: 'Construction', bobot: 'I' },
  occupancy: { no: '3', name: 'Occupancy', bobot: 'I' },
  protection: { no: '4', name: 'Protection', bobot: 'I' },
  exposure: { no: '5', name: 'Exposure', bobot: 'II' },
  natural_hazards: { no: '6', name: 'Natural Hazards', bobot: 'II' },
  other_peril: { no: '7', name: 'Other Perils', bobot: 'II' },
  loss_estimate: { no: '8', name: 'Loss Estimate', bobot: 'III' },
};

/** Urutan tampil di tabel hasil. */
export const GRADE_SECTION_ORDER: GradeItemCode[] = [
  'management',
  'construction',
  'occupancy',
  'protection',
  'exposure',
  'natural_hazards',
  'other_peril',
  'loss_estimate',
];
