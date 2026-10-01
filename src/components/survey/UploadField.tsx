import { useEffect, useMemo, useRef } from 'react';
import { LABEL_CLASS } from './tokens';
import { SurveyIcon } from './icons';

interface UploadFieldProps {
  label: string;
  accept: string;
  files: File[];
  hint?: string;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}

/** Input file + pratinjau (`.upload-preview` di reff.html). */
export function UploadField({ label, accept, files, hint, onAdd, onRemove }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Object URL dibersihkan saat daftar file berubah atau komponen dilepas.
  const previewUrls = useMemo(
    () => files.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null)),
    [files],
  );
  useEffect(() => {
    return () => previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
  }, [previewUrls]);

  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="w-full cursor-pointer rounded-lg border-[1.5px] border-dashed border-survey-g3 bg-survey-g1 px-3 py-2.5 text-xs text-survey-dark file:mr-3 file:rounded-md file:border-0 file:bg-survey-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        onChange={(event) => {
          if (event.target.files?.length) onAdd(Array.from(event.target.files));
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
      {hint && <p className="mt-1 text-[11px] italic text-survey-g3">{hint}</p>}

      {files.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="w-[90px] text-center text-[10px] text-survey-dark">
              {previewUrls[index] ? (
                <img
                  src={previewUrls[index] ?? ''}
                  alt={file.name}
                  className="mb-1 block h-[90px] w-[90px] rounded-lg border-[1.5px] border-survey-g2 object-cover"
                />
              ) : (
                <div className="mb-1 flex h-[90px] w-[90px] items-center justify-center rounded-lg border-[1.5px] border-survey-g2 bg-survey-g1 text-survey-g3">
                  <SurveyIcon name="document" className="h-7 w-7" />
                </div>
              )}
              <div className="truncate" title={file.name}>
                {file.name}
              </div>
              <button
                type="button"
                className="text-[10px] font-bold text-survey-red hover:underline"
                onClick={() => onRemove(index)}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
