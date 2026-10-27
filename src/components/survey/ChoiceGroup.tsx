import { BADGE_TONE_CLASS, LABEL_CLASS, type BadgeTone } from './tokens';
import { Req } from './SectionCard';

export interface ChoiceOption {
  value: string;
  label: string;
  desc?: string;
  /** Badge kecil di kanan-bawah label (mis. "Good (8)"). */
  badge?: string;
  tone?: BadgeTone;
}

interface ChoiceGroupProps {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  cols?: 1 | 2 | 3 | 4;
  required?: boolean;
  hint?: string;
  /** Opsi yang tidak bisa dipilih (mis. "Ada & Fungsional" terkunci — poin review #8). */
  disabledValues?: string[];
  /** Alasan penguncian, ditampilkan sebagai tooltip pada opsi terkunci. */
  disabledTitle?: string;
}

const COLS_CLASS: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

/** Grup kartu pilihan radio (`.radio-card` di reff.html). */
export function ChoiceGroup({
  label,
  value,
  options,
  onChange,
  cols = 2,
  required,
  hint,
  disabledValues,
  disabledTitle,
}: ChoiceGroupProps) {
  return (
    <div>
      <span className={LABEL_CLASS}>
        {label}
        {required && <Req />}
      </span>
      <div className={`grid gap-2 ${COLS_CLASS[cols]}`} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          const locked = disabledValues?.includes(option.value) ?? false;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={locked}
              disabled={locked}
              title={locked ? disabledTitle : undefined}
              onClick={() => {
                if (!locked) onChange(option.value);
              }}
              className={`flex items-start gap-2.5 rounded-lg border-[1.5px] px-3.5 py-2.5 text-left transition-colors ${
                locked
                  ? 'cursor-not-allowed border-survey-g2 bg-survey-g1 opacity-50'
                  : selected
                    ? 'border-survey-navy bg-survey-llblue'
                    : 'border-survey-g2 bg-white hover:border-survey-blue hover:bg-survey-llblue'
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                  selected ? 'border-survey-navy' : 'border-survey-g3'
                }`}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-survey-navy" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-survey-dark">{option.label}</span>
                {option.desc && (
                  <span className="mt-0.5 block text-[11px] leading-snug text-survey-g3">{option.desc}</span>
                )}
                {option.badge && (
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-[1px] text-[10px] font-bold ${
                      option.tone ? BADGE_TONE_CLASS[option.tone] : 'bg-survey-g1 text-survey-g3'
                    }`}
                  >
                    {option.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1 text-[11px] italic text-survey-g3">{hint}</p>}
    </div>
  );
}
