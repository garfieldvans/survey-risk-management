import type { GradeResult } from '../../shared';
import { bandLabelOfScore } from '../../shared';
import { GRADE_SECTION_META, GRADE_SECTION_ORDER } from '../../lib/gradeSections';
import { BAND_TONE, CATEGORY_TONE, RESULT_CARD_CLASS, RESULT_TEXT_CLASS } from './tokens';
import { ScoreBadge } from './CheckList';

interface ResultCardProps {
  result: GradeResult;
  ownerName: string;
  surveyDate: string;
}

/** Kartu ringkasan hasil + tabel skor per kategori (`.result-card` + `.score-tbl` reff.html). */
export function ResultCard({ result, ownerName, surveyDate }: ResultCardProps) {
  const tone = CATEGORY_TONE[result.category] ?? 'avg';

  return (
    <div>
      <div className={`rounded-xl p-5 text-center ${RESULT_CARD_CLASS[tone]}`}>
        <div className={`text-[32px] font-extrabold leading-tight ${RESULT_TEXT_CLASS[tone]}`}>
          {result.category}
        </div>
        <div className="mt-1 text-sm text-survey-dark">
          Total Skor: <b>{result.total} / 55 poin</b>
        </div>
        <div className="mt-1 text-xs text-survey-g3">
          Tertanggung: {ownerName || '—'} | Survey: {surveyDate || '—'}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-survey-g2">
        <table className="w-full min-w-[420px] border-collapse text-xs">
          <thead>
            <tr className="bg-survey-navy text-left text-[11px] text-white">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Kategori</th>
              <th className="px-3 py-2 font-semibold">Bobot</th>
              <th className="px-3 py-2 font-semibold">Rating</th>
              <th className="px-3 py-2 font-semibold">Skor</th>
            </tr>
          </thead>
          <tbody>
            {GRADE_SECTION_ORDER.map((code) => {
              const meta = GRADE_SECTION_META[code];
              const score = result.scores[code];
              const band = bandLabelOfScore(score);
              return (
                <tr key={code} className="border-b-[0.5px] border-survey-g2 last:border-b-0">
                  <td className="px-3 py-2 text-survey-g3">{meta.no}</td>
                  <td className="px-3 py-2 font-medium text-survey-dark">{meta.name}</td>
                  <td className="px-3 py-2 text-survey-g3">{meta.bobot}</td>
                  <td className="px-3 py-2">
                    <ScoreBadge tone={BAND_TONE[band] ?? 'avg'}>{band}</ScoreBadge>
                  </td>
                  <td className="px-3 py-2 font-bold text-survey-dark">{score}</td>
                </tr>
              );
            })}
            <tr className="border-t-[0.5px] border-survey-g2 bg-survey-g1 font-bold">
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-survey-dark">TOTAL</td>
              <td className="px-3 py-2" />
              <td className={`px-3 py-2 ${RESULT_TEXT_CLASS[tone]}`}>{result.category}</td>
              <td className="px-3 py-2 text-survey-dark">{result.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
