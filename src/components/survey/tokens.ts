/**
 * Token visual wizard survey — dipetakan 1:1 dari CSS di apps/api/data/reff.html
 * (`.sec-hdr`, `.radio-card .rc-score`, `.result-card`, dst).
 */

/** Warna header kartu seksi (`.sec-hdr` background). */
export type SectionTone = 'navy' | 'navy2' | 'blue' | 'red' | 'orange' | 'green';

/** Tone badge skor (`score-good` / `score-avg` / `score-marg` / `score-poor`). */
export type BadgeTone = 'good' | 'avg' | 'marg' | 'poor';

export const SECTION_HEADER_BG: Record<SectionTone, string> = {
  navy: 'bg-survey-navy',
  navy2: 'bg-survey-navy2',
  blue: 'bg-survey-blue',
  red: 'bg-survey-red',
  orange: 'bg-survey-orange',
  green: 'bg-survey-green',
};

/** Badge kecil di dalam kartu pilihan (`.rc-score`). */
export const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
  good: 'bg-survey-lgreen text-survey-green',
  avg: 'bg-survey-lorng text-survey-orange',
  marg: 'bg-survey-lred text-survey-red',
  poor: 'bg-survey-lpurp text-survey-purple',
};

/** Kotak hasil grading (`.result-card`). */
export const RESULT_CARD_CLASS: Record<BadgeTone, string> = {
  good: 'bg-survey-lgreen border-2 border-survey-green',
  avg: 'bg-survey-lorng border-2 border-survey-orange',
  marg: 'bg-survey-lred border-2 border-survey-red',
  poor: 'bg-survey-lpurp border-2 border-survey-purple',
};

export const RESULT_TEXT_CLASS: Record<BadgeTone, string> = {
  good: 'text-survey-green',
  avg: 'text-survey-orange',
  marg: 'text-survey-red',
  poor: 'text-survey-purple',
};

/** Pemetaan kategori grading → tone badge. */
export const CATEGORY_TONE: Record<string, BadgeTone> = {
  GOOD: 'good',
  AVERAGE: 'avg',
  MARGINAL: 'marg',
  POOR: 'poor',
};

/** Badge label band per item (Good/Average/Marginal/Poor). */
export const BAND_TONE: Record<string, BadgeTone> = {
  Good: 'good',
  Average: 'avg',
  Marginal: 'marg',
  Poor: 'poor',
};

/** Kelas input/textarea/select standar (setara `input[type=text]` di reff.html). */
export const FIELD_CLASS =
  'w-full rounded-lg border-[1.5px] border-survey-g2 bg-white px-3 py-2.5 text-[13px] text-survey-dark outline-none transition-colors placeholder:text-survey-g3 focus:border-survey-blue';

export const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-survey-dark';
