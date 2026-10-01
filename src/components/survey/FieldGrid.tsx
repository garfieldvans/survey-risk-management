import type { FieldDef } from '../../lib/surveyForm';
import { LABEL_CLASS } from './tokens';
import { CheckList } from './CheckList';
import { SelectField, TextAreaField, TextField } from './TextField';

interface FieldGridProps {
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Ada' },
  { value: 'no', label: 'Tidak ada' },
];

/** Render daftar field wizard (port tata letak `.grid-2` + `.form-group` reff.html). */
export function FieldGrid({ fields, values, onChange }: FieldGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.key}
          className={field.type === 'check' || field.type === 'textarea' || field.cols !== 2 ? 'sm:col-span-2' : ''}
        >
          <FieldInput field={field} value={values[field.key] ?? ''} onChange={(value) => onChange(field.key, value)} />
        </div>
      ))}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === 'check') {
    return (
      <div>
        <span className={LABEL_CLASS}>{field.label}</span>
        <CheckList
          items={(field.options ?? []).map((option) => ({ id: option.value, label: option.label }))}
          checked={value.split(',').filter(Boolean)}
          onToggle={(id) => {
            const selected = new Set(value.split(',').filter(Boolean));
            if (selected.has(id)) selected.delete(id);
            else selected.add(id);
            onChange([...selected].join(','));
          }}
        />
        {field.hint && <p className="mt-1 text-[11px] italic text-survey-g3">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <TextAreaField
        label={field.label}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
        rows={3}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <SelectField
        label={field.label}
        value={value}
        options={field.options ?? []}
        onChange={onChange}
        hint={field.hint}
      />
    );
  }

  if (field.type === 'yesno') {
    return (
      <div>
        <span className={LABEL_CLASS}>{field.label}</span>
        <div className="grid grid-cols-2 gap-2">
          {YES_NO_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(option.value)}
                className={`flex items-center gap-2.5 rounded-lg border-[1.5px] px-3.5 py-2.5 text-left transition-colors ${
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
        {field.hint && <p className="mt-1 text-[11px] italic text-survey-g3">{field.hint}</p>}
      </div>
    );
  }

  return (
    <TextField
      label={field.label}
      value={value}
      onChange={onChange}
      type={field.type === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder}
      hint={field.hint}
      min={field.type === 'number' ? 0 : undefined}
    />
  );
}
