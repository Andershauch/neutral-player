"use client";

interface BaseProps {
  label: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

interface TextFieldProps extends BaseProps {
  type?: "text" | "email" | "password" | "color";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface TextareaFieldProps extends BaseProps {
  type: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseProps {
  type: "select";
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

type FormFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps;

/// Generaliserer ColorField/TokenTextField (BrandingSettingsCard) og de
/// haandrullede label+input-par i EmbedEditor m.fl. Bygger paa .np-field/
/// .np-textarea (app/globals.css) i stedet for at opfinde ny inputstyling.
export default function FormField(props: FormFieldProps) {
  const { label, hint, error, disabled, className = "" } = props;

  return (
    <label className={`flex w-full flex-col gap-2 ${className}`.trim()}>
      <span className="np-kicker">{label}</span>

      {props.type === "textarea" ? (
        <textarea
          className="np-textarea"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows}
          disabled={disabled}
        />
      ) : props.type === "select" ? (
        <select
          className="np-field"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          disabled={disabled}
        >
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={props.type ?? "text"}
          className="np-field"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          disabled={disabled}
        />
      )}

      {error ? (
        <span className="text-xs font-semibold text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-gray-500">{hint}</span>
      ) : null}
    </label>
  );
}
