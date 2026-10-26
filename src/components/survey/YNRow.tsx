import { Req } from './SectionCard';

interface YNRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  /** Id unik untuk grouping radio (port `name` radio di prototipe). */
  name: string;
}

const OPTIONS = [
  { value: 'yes', label: 'Ya' },
  { value: 'no', label: 'Tidak' },
] as const;

/**
 * Baris pertanyaan Ya/Tidak — port `.yn-question` di prototipe revisi terbaru:
 * grid satu baris, label pertanyaan di kiri, radio-grid (Ya/Tidak) 210–280px di
 * kanan, latar abu-abu; di layar ≤640px turun jadi bertumpuk.
 */
export function YNRow({ label, value, onChange, required, name }: YNRowProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 rounded-[9px] border-[1px] border-survey-g2 bg-survey-g1 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(210px,280px)]">
      <div className="text-xs font-semibold leading-[1.45] text-survey-dark">
        {label}
        {required && <Req />}
      </div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={label}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${name}-${option.value}`}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-2.5 rounded-lg border-[1.5px] px-3 py-2 text-left transition-colors ${
                selected
                  ? 'border-survey-navy bg-survey-llblue'
                  : 'border-survey-g2 bg-white hover:border-survey-blue hover:bg-survey-llblue'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                  selected ? 'border-survey-navy' : 'border-survey-g3'
                }`}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-survey-navy" />}
              </span>
              <span className="text-xs font-semibold text-survey-dark">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
