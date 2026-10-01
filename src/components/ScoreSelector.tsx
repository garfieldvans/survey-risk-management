import { bandOfScore, SCORE_MAX, SCORE_MIN, type GradeCategory } from '../shared';
import './ScoreSelector.scss';

interface Props {
  value: number;
  onChange: (score: number) => void;
  label: string;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

const BAND_COLORS: Record<GradeCategory, string> = {
  POOR: 'score-poor',
  MARGINAL: 'score-marginal',
  AVERAGE: 'score-average',
  GOOD: 'score-good',
};

const BAND_LABELS: Record<GradeCategory, string> = {
  POOR: 'Poor',
  MARGINAL: 'Marginal',
  AVERAGE: 'Average',
  GOOD: 'Good',
};

export function ScoreSelector({ value, onChange, label, notes, onNotesChange }: Props) {
  const band = bandOfScore(value);
  const options: number[] = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => SCORE_MIN + i);

  return (
    <div className="card mb-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BAND_COLORS[band]}`}>
          {BAND_LABELS[band]} ({value})
        </span>
      </div>

      <div className="mb-3 flex gap-1.5">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`score-btn h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${
              n === value ? 'active' : 'hover:bg-slate-100'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Rentang Skor</div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>1-2 Poor</span>
            <span>3-4 Marginal</span>
            <span>5-6 Average</span>
            <span>7-8 Good</span>
          </div>
        </div>
      </div>

      {onNotesChange !== undefined && (
        <textarea
          className="mt-3 input resize-none text-xs"
          rows={2}
          placeholder={`Catatan ${label}...`}
          value={notes ?? ''}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      )}
    </div>
  );
}