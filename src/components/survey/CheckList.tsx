import type { ReactNode } from 'react';
import { BADGE_TONE_CLASS, type BadgeTone } from './tokens';
import { SurveyIcon } from './icons';

export interface CheckItem {
  id: string;
  label: string;
}

interface CheckListProps {
  items: CheckItem[];
  checked: string[];
  onToggle: (id: string) => void;
}

/** Baris checklist kondisi terpenuhi (`.check-item` di reff.html). */
export function CheckList({ items, checked, onToggle }: CheckListProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isChecked = checked.includes(item.id);
        return (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-survey-g1 px-3 py-2 transition-colors hover:bg-survey-llblue"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] ${
                isChecked ? 'border-survey-green bg-survey-green text-white' : 'border-survey-g3 bg-white'
              }`}
            >
              {isChecked && <SurveyIcon name="check" className="h-3 w-3" />}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={isChecked}
              onChange={() => onToggle(item.id)}
            />
            <span className="text-xs leading-snug text-survey-dark">{item.label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Badge kecil berwarna (`.badge` / `.rc-score`). */
export function ScoreBadge({ children, tone = 'avg' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-[2px] text-[10px] font-bold ${BADGE_TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}
