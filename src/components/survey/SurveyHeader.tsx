import type { ReactNode } from 'react';

interface SurveyHeaderProps {
  /** Badge kanan (`.header-badge`), mis. "🏢 Property". */
  badge: string;
  logo?: string;
  title?: string;
  sub?: string;
  /** Elemen opsional di paling kiri (mis. tombol menu drawer). */
  leftSlot?: ReactNode;
}

/**
 * Header navy wizard — 1:1 `.app-header` reff.html:
 * pita navy full-bleed sticky (bayangan 0 2px 12px), konten max-width 900px,
 * logo kotak putih "aswata", judul + subjudul lblue, badge pill biru di kanan.
 * Dipasang di SurveyorLayout (di luar container max-w-2xl agar full-width).
 */
export function SurveyHeader({
  badge,
  logo = 'aswata',
  title = 'Survey Report & Risk Grading — Property',
  sub = 'Digitalisasi Form Survey | Aswata Insurance',
  leftSlot,
}: SurveyHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-survey-navy shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex max-w-[900px] items-center gap-3.5 px-5 py-3.5">
        {leftSlot && <div className="shrink-0">{leftSlot}</div>}
        <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[13px] font-bold tracking-wide text-survey-navy">
          {logo}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-white">{title}</div>
          <div className="mt-0.5 truncate text-[11px] text-survey-lblue">{sub}</div>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-survey-blue px-3 py-1 text-[11px] font-semibold text-white">
          {badge}
        </span>
      </div>
    </header>
  );
}
