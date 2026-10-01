interface ProgressStepsProps {
  labels: string[];
  current: number;
  onSelect: (index: number) => void;
  /** Step yang requirement-nya belum terpenuhi — ditandai titik merah. */
  invalidSteps?: Record<number, string>;
}

/**
 * Strip progres langkah — 1:1 `.progress-wrap` / `.pstep` di reff.html:
 * pita navy2 full-bleed, konten max-width 900px (padding 10px 20px),
 * angka dalam lingkaran, langkah selesai hijau, langkah aktif putih.
 * Semua langkah bisa diklik langsung (setara onclick="goTo(i)" di reff.html) —
 * navigasi maju melewati langkah yang belum lengkap diblokir di sisi wizard.
 */
export function ProgressSteps({ labels, current, onSelect, invalidSteps }: ProgressStepsProps) {
  return (
    <div className="bg-survey-navy2 px-5 py-2.5">
      <div className="mx-auto max-w-[900px]">
        <ol className="flex overflow-x-auto">
          {labels.map((label, index) => {
            const isActive = index === current;
            const isDone = index < current;
            const isInvalid = !!invalidSteps?.[index];
            return (
              <li key={label} className="min-w-[80px] flex-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`flex w-full cursor-pointer flex-col items-center gap-1 border-b-[3px] px-1 pb-1.5 pt-1 transition-colors ${
                    isActive
                      ? 'border-white'
                      : isDone
                        ? 'border-survey-green hover:border-white'
                        : 'border-transparent hover:border-white/40'
                  }`}
                >
                  <span
                    className={`relative flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold ${
                      isActive
                        ? 'bg-white text-survey-navy'
                        : isDone
                          ? 'bg-survey-green text-white'
                          : 'bg-white/15 text-white'
                    }`}
                  >
                    {index === labels.length - 1 ? '✓' : index + 1}
                    {isInvalid && (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full bg-survey-red"
                        title="Langkah ini belum lengkap"
                      />
                    )}
                  </span>
                  <span
                    className={`whitespace-nowrap text-[9px] ${
                      isActive ? 'font-semibold text-white' : 'text-white/70'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
