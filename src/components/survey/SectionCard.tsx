import type { ReactNode } from 'react';
import { SECTION_HEADER_BG, type SectionTone } from './tokens';
import { SurveyIcon, type SurveyIconName } from './icons';

interface SectionCardProps {
  icon: SurveyIconName;
  title: string;
  sub?: string;
  tone?: SectionTone;
  children: ReactNode;
}

/** Kartu seksi wizard — header berwarna + ikon, setara `.section-card` di reff.html. */
export function SectionCard({ icon, title, sub, tone = 'navy', children }: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <header className={`flex items-center gap-2.5 px-5 py-3.5 ${SECTION_HEADER_BG[tone]}`}>
        <SurveyIcon name={icon} className="h-5 w-5 shrink-0 text-white/90" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white">{title}</h3>
          {sub && <p className="mt-0.5 text-[11px] leading-snug text-white/75">{sub}</p>}
        </div>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

/** Sub-judul bagian di dalam kartu (setara `<div style="font-weight:700;color:navy">`). */
export function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="text-xs font-bold text-survey-navy">{children}</h4>;
}

/** Garis pemisah antar bagian (`.divider`). */
export function Divider() {
  return <div className="h-px bg-survey-g2" />;
}

/** Wajib diisi (`.req`). */
export function Req() {
  return <span className="text-survey-red"> *</span>;
}
