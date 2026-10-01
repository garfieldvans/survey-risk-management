import { FIELD_CLASS, LABEL_CLASS } from './tokens';
import { Req } from './SectionCard';

interface TextFieldProps {
  label: string;
  value: string;
  /** Opsional bila input readonly. */
  onChange?: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  hint?: string;
  required?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
}

/** Input teks/angka/tanggal dengan label (`.form-group` di reff.html). */
export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  required,
  readOnly,
  min,
  max,
}: TextFieldProps) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required && <Req />}
      </label>
      <input
        type={type}
        className={`${FIELD_CLASS} ${readOnly ? 'bg-survey-g1 text-survey-g3' : ''}`}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        min={min}
        max={max}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
      {hint && <p className="mt-1 text-[11px] italic text-survey-g3">{hint}</p>}
    </div>
  );
}

interface TextAreaFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

/** Textarea dengan label opsional. */
export function TextAreaField({ label, value, onChange, placeholder, rows = 3, required }: TextAreaFieldProps) {
  return (
    <div>
      {label && (
        <label className={LABEL_CLASS}>
          {label}
          {required && <Req />}
        </label>
      )}
      <textarea
        className={`${FIELD_CLASS} resize-y`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

/** Dropdown pilihan. */
export function SelectField({ label, value, options, onChange, placeholder = '— pilih —', hint, required }: SelectFieldProps) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required && <Req />}
      </label>
      <select className={FIELD_CLASS} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-[11px] italic text-survey-g3">{hint}</p>}
    </div>
  );
}
