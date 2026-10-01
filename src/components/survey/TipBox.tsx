import type { ReactNode } from 'react';

type TipTone = 'info' | 'warn' | 'danger';

const TONE_CLASS: Record<TipTone, string> = {
  info: 'border-survey-blue bg-survey-llblue text-survey-navy2',
  warn: 'border-survey-orange bg-survey-lorng text-[#412402]',
  danger: 'border-survey-red bg-survey-lred text-[#3D0000]',
};

/** Kotak catatan (`.tip-box` di reff.html). */
export function TipBox({ children, tone = 'info' }: { children: ReactNode; tone?: TipTone }) {
  return (
    <div className={`rounded-lg border-[0.5px] px-3.5 py-2.5 text-[11px] leading-relaxed ${TONE_CLASS[tone]}`}>
      {children}
    </div>
  );
}
